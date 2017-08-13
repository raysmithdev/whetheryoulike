var nodemailer = require('nodemailer');

const transportOptions = {
    service: 'Gmail',
    auth: {
        user: 'phoebusapollotest@gmail.com',
        pass: 'Sup3rSecr3t'
    }
}

const smtpTransport = nodemailer.createTransport({
    from: 'phoebusapollotest@gmail.com',
    options: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'phoebusapollotest@gmail.com',
            pass: 'Sup3rSecr3t'
        }
    }
});

module.exports = {transportOptions, smtpTransport}