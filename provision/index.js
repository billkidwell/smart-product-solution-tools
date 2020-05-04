require('dotenv').config();
const AWS = require('aws-sdk');
const uuid = require('uuid');
const fs = require('fs').promises;
const Mustache = require('mustache');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');
const symbol = require('log-symbols');
let log = console.log;

/*****************************************
 *   Default Model and Device Details    *
 *****************************************/

const MODEL = 'test-model';
const DETAILS = {
    model: "INFINITY 19 HEAT PUMP",
    capacity: "2-5 ton",
    requirement: "208-230 V",
    coolingEfficiency: "Up to 19 SEER",
    heatingEfficiency: "Up to 10 HSPF"
};

/*****************************************/

const region = process.env.AWS_REGION;
const tableName = process.env.REFERENCE_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region });
const iot = new AWS.Iot();


/*****************************************/

let serialNumber = uuid.v4();
log(chalk.green(symbol.success, 'Generate a UUID for the serial number'));

let device = {
    deviceId: serialNumber,
    modelNumber: MODEL,
    details: DETAILS
};

// Lookup the ATS endpoint and create the .env file
iot.describeEndpoint({ endpointType: "iot:Data-ATS" }).promise()
    .then((data) => {
        return createDotEnv(data.endpointAddress, serialNumber);
    }).then(() => {
        log(chalk.green(symbol.success, 'Create .env for the simulator'));
    }).catch(err => console.error(chalk.redBright(symbol.error, 'Error creating .env file', err)));

const deviceDir = makeDeviceDirectory(serialNumber);
log(chalk.green(symbol.success, 'Create a device directory'));

createCSRConfig(serialNumber);
// Call createCert.sh <uuid>
exec(`./createCert.sh ${serialNumber}`)
    .then(({ stdout, stderr }) => {
        // console.log(chalk.inverse('[createCert]' + stdout));
        // console.log(chalk.green.bgWhite('[createCert]' + stderr));
        log(chalk.green(symbol.success, 'Create a certificate signing request'));
        log(chalk.green(symbol.success, 'Create a device certificate file'));
    })
    .then(
        // Save a copy of the device information
        fs.writeFile(`./devices/${serialNumber}/device.json`, JSON.stringify(device))
    )
    .then(() => {
        log(chalk.green(symbol.success, 'Create a copy of the device information on disk'))
    })
    .then(dynamoDb.put({
        TableName: tableName,
        Item: device
    }).promise())
    .then(() => {
        log(chalk.green(symbol.success, 'Update db with serial number, model number and device detail.'))
    })
    .then(() => {
        // Output information: serialNumber, model, device details, and certs.tar.gz
        log("");
        log(chalk.bold.inverse(`Device Information`));
        log("=".repeat(105));
        log(`Serial Number: ${chalk.bold(serialNumber)}`);
        log(`Model Number: ${chalk.bold(MODEL)}`);
        log("=".repeat(105));
        log("Cert package for the device");
        log(`${process.cwd()}/devices/${serialNumber}/certs.tar.gz`);
    })
    .catch((reason) => console.error(chalk.red(reason)));

async function makeDeviceDirectory(serialNumber) {
    return await fs.mkdir(`./devices/${serialNumber}`);

}

/**
 * Generate a .env file for the simulator.
 * @param {string} endpoint - AWS IoT endpoint
 * @param {string} serialNumber - Serial Number (uuid)
 */
async function createDotEnv(endpoint, serialNumber) {
    let dotEnvTemplate = await fs.readFile('./templates/dotenv.mustache', 'utf8');
    var dotEnv = Mustache.render(
        dotEnvTemplate,
        {
            serialNumber: serialNumber,
            iotEndpoint: endpoint
        });
    await fs.writeFile(`./devices/${serialNumber}/.env`, dotEnv);
}

/**
 * Create a cnf file that will be used to generate a certificate signing request.
 * @param {string} serialNumber - Serial Number for simulated device (UUID)
 */
async function createCSRConfig(serialNumber) {
    let cnfTemplate = await fs.readFile('./templates/cert-signing-request.cnf.mustache', 'utf8');
    var cnf = Mustache.render(
        cnfTemplate,
        {
            serialNumber: serialNumber,
            organization: "Big Ass Fans"
        });
    await fs.writeFile(`./devices/${serialNumber}/csr.cnf`, cnf);
}