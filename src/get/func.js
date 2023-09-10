const url = require('url')
const fdk = require('@fnproject/fdk')
const NoSQLClient = require('oracle-nosqldb').NoSQLClient
const client = new NoSQLClient({
	compartment: process.env.COMPARTMENT_OCID,
	auth: {
		iam: {
			useResourcePrincipal: true
		}
	}
})

const allowedAttributes = ['temperature', 'lux', 'pressure']
const allowedMinutes = 180

// Retrieve the last hour by default
const defaultMinutes = 60
// JS does time arithmetic in milliseconds
const msPerMinute = 60000

fdk.handle(async function (input, ctx) {
	try {
		// From https://technology.amis.nl/oracle-cloud/reading-query-parameters-in-get-requests-to-project-fn-functions-and-oracle-functions-as-a-service/
		queryParams = url.parse(ctx.headers["Fn-Http-Request-Url"][0], true).query

		// Use GET query params if the exist, otherwise use the POST body
		const reqMinutes = queryParams.minutes ?? input.minutes
		// If a specific timespan (in minutes) was requested and within the allowed limit, use it. Otherwise, use the default. 
		const timeSpan = ((reqMinutes && reqMinutes <= allowedMinutes) ? reqMinutes : defaultMinutes) * msPerMinute

		var resultSet = []
		// Filter either the GET query params or POST body by the allowed attributes
		const enviroAttributes = (queryParams.attributes ?? input.attributes).filter(value => allowedAttributes.includes(value));
		const query = `SELECT collectedAt,${enviroAttributes} FROM ${process.env.TABLE_NAME} WHERE collectedAt > '${new Date(new Date() - timeSpan).toISOString()}' ORDER BY collectedAt`
		for await (let result of client.queryIterable(query)) {
			for (let row of result.rows) {
				resultSet.push(row)
			}
		}
		return resultSet
	} catch (err) {
		console.log(JSON.stringify(err, undefined, 2))
		return err
	}
})
