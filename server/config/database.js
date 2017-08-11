exports.DATABASE_URL = process.env.DATABASE_URL ||
						global.DATABASE_URL ||
						'mongodb://mmarovich:12345@ds147882.mlab.com:47882/users-whether';
exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://mmarovich:12345@ds147842.mlab.com:47842/test-whether');