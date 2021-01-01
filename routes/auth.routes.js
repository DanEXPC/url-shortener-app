const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../modules/User')
const router = Router()

// /api/auth/register
router.post(
    '/register',
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Minimal lenght 6 symbols')
            .isLength({min: 6})
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors:errors.array(),
                message: 'Incorrect data at registration'
            })
        }

        const {email, password} = req.body

        const candidate = await User.findOne( {email} )

        if (candidate) {
            return res.status(400).json({message: 'User has been already registed'})
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({email, password: hashedPassword})

        await user.save()

        res.status(201).json({message: 'User has been created'})

    } catch (e) {
        res.status(500).json({message: 'Something goes wrong :('})
    }
})

// /api/auth/login
router.post(
    '/login',
    [
        check('email', 'Enter a correct email').normalizeEmail().isEmail(),
        check('password', 'Enter a password').exists()
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors:errors.array(),
                message: 'Incorrect data at login'
            })
        }

        const {email, password} = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json( {message: 'User does not found'} )
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password. Try again'})
        }

        const token = jwt.sign(
            { userId: user.id },
            config.get('jwtSecret'),
            { expiresIn: '1h' }
        )

        res.json( { token, userId: user.id } )

    } catch (e) {
        res.status(500).json({message: 'Something goes wrong :('})
    }
})

module.exports = router