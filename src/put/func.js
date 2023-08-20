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

fdk.handle(async function (input) {
	try {
		return await client.put(
			process.env.TABLE_NAME,
			{
				createdAt: new Date().toISOString(),
				collectedAt: new Date(input.collectedAt),
				temperature: input.temperature,
				lux: input.lux,
				pressure: input.pressure
			}
		)
	} catch (err) {
		console.log(JSON.stringify(err, undefined, 2));
		return err;
	}
})
