import process from 'process';
import chalk from 'chalk';

const token = process.env.CLOUDFLARE_TOKEN;
const domain = process.env.CLOUDFLARE_DOMAIN;
const record = process.env.CLOUDFLARE_RECORD + '.' + domain;

const banner = `

    ░█▀▀█ █── █▀▀█ █──█ █▀▀▄ █▀▀ █── █▀▀█ █▀▀█ █▀▀ ░█▀▀▄ ░█▀▀▄ ░█▄─░█ ░█▀▀▀█ 
    ░█─── █── █──█ █──█ █──█ █▀▀ █── █▄▄█ █▄▄▀ █▀▀ ░█─░█ ░█─░█ ░█░█░█ ─▀▀▀▄▄ 
    ░█▄▄█ ▀▀▀ ▀▀▀▀ ─▀▀▀ ▀▀▀─ ▀── ▀▀▀ ▀──▀ ▀─▀▀ ▀▀▀ ░█▄▄▀ ░█▄▄▀ ░█──▀█ ░█▄▄▄█
                              Made by Abysmal#1608                          
`;
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
};

const log = console.log;
const logError = (text: string) => log(chalk.red(chalk.red.bold('[❌]'), text));
const logSuccess = (text: string) => log(chalk.green(chalk.green.bold('[✔]'), text));
let res;

const main = async () => {
    // validate the token
    res = await (await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: headers })).json();
    if (res.success !== true) {
        return logError('API token validation failed. Terminating script.');
    }
    logSuccess(`API token validation ${token} success.`);

    // validate the domain
    res = await (await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, { headers: headers })).json();
    if (res.result.length === 0) {
        return logError(`Search for the DNS domain ${domain} return zero results. Terminating script.`);
    }
    const zoneID = res.result[0].id;
    logSuccess(`Domain zone ${domain} ID: ${zoneID}`);

    // validate the dns record and get data
    const data = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records?name=${record}`, { headers: headers })).json();
    if (data.result.length === 0) {
        return logError(`Search for the DNS record ${record} return zero results. Terminating script.`);
    }
    logSuccess(`DNS record ${record} IPV4: Type=${data.result[0].type}, IP=${data.result[0].content}`);
    logSuccess(`DNS record ${record} IPV6: Type=${data.result[1].type}, IP=${data.result[1].content}`);

    // get new ip
    const newIpv4 = await (await fetch('https://v4.ident.me')).text();
    const newIpv6 = await (await fetch('https://v6.ident.me')).text();

    if (data.result[0].content !== newIpv4) {
        logSuccess('The current IPV4 address does not match the DNS record IPV4 address. Attempt to update.');

        const newData = {
            'type': data.result[0].type,
            'name': record,
            'content': newIpv4,
            'ttl': data.result[0].ttl,
            'proxied': data.result[0].proxied,
        };

        res = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records/${data.result[0].id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(newData),
        })).json();
        if (res.errors && res.errors.length >= 1) {
            return logError(`DNS IPV4 record update failed. Error: ${res.errors[0].message}`);
        }

        logSuccess('DNS IPV4 record update successfully.');
    } else {
        log(chalk.white(chalk.white.bold('[=]'), 'The current IPV4 address and DNS record IPV4 address are the same. There\'s no need to update.'));
    }

    if (data.result[1].content !== newIpv6) {
        logSuccess('The current IPV6 address does not match the DNS record IPV5 address. Attempt to update');

        const newData = {
            'type': data.result[1].type,
            'name': record,
            'content': newIpv6,
            'ttl': data.result[1].ttl,
            'proxied': data.result[1].proxied,
        };

        res = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records/${data.result[1].id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(newData),
        })).json();
        if (res.errors && res.errors.length >= 1) {
            return logError(`DNS IPV6 record update failed. Error: ${res.errors[0].message}`);
        }

        logSuccess('DNS IPV6 record update successfully.');
    } else {
        log(chalk.white(chalk.white.bold('[=]'), 'The current IPV6 address and DNS record IPV6 address are the same. There\'s no need to update.'));
    }

    log(chalk.magentaBright(chalk.magentaBright.bold('[!]'), `Finished at ${new Date().toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}`));
};

log(chalk.magentaBright(banner));
main();