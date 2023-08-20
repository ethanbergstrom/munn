const fdk = require('@fnproject/fdk');
const NoSQLClient = require('oracle-nosqldb').NoSQLClient;
const client = new NoSQLClient({
	compartment: process.env.COMPARTMENT_OCID,
	auth: {
		iam: {
			useResourcePrincipal: true
		}
	}
});

const allowedAttributes = ['temperature', 'lux', 'pressure'];
const allowedMinutes = 180;

// Retrieve the last hour by default
const defaultMinutes = 60;
// JS does time arithmetic in milliseconds
const msPerMinute = 60000;

fdk.handle(async function (input) {
	try {
		// If a specific timespan (in minutes) was requested and within the allowed limit, use it. Otherwise, use the default. 
		const reqMinutes = input['minutes']
		const timeSpan = (reqMinutes && reqMinutes < allowedMinutes) ? reqMinutes : defaultMinutes

		var resultSet = []
		const enviroAttributes = input.attributes.filter(value => allowedAttributes.includes(value));
		const query = `SELECT collectedAt,${enviroAttributes} FROM ${process.env.TABLE_NAME} WHERE collectedAt > '${new Date(new Date() - timeSpan).toISOString()}' ORDER BY collectedAt`
        for await(let result of client.queryIterable(query)) {
			for (let row of result.rows) {
				resultSet.push(row)
			}
        }
		return resultSet
	} catch (err) {
		console.log(JSON.stringify(err, undefined, 2));
		return err;
	}
})
