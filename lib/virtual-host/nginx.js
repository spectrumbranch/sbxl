const { promisify } = require('util');
const sbxl = require('../');
const parse = promisify(require('nginx-conf').parse);

const handleParseUpstreamBlock = function (block) {
    const upstreamBlock = block.children[0];
    return {
        name: block.value,
        type: upstreamBlock.name,
        host: upstreamBlock.value
    }
};

const handleParseServerBlock = function (block) {
    const results = {};
    const serverBlock = block.children;

    for (let i = 0; i < serverBlock.length; i++) {
        const mini = serverBlock[i];
        if (mini.name === 'listen') {
            if (mini.value.includes('[::]:443 ssl')) {
                results.type = 'https';
                results.ipv6 = true;
            } else if (mini.value.includes('443 ssl')) {
                results.type = 'https';
                results.ipv4 = true;
            } else if (mini.value.includes('[::]:80')) {
                results.type = 'http';
                results.ipv6 = true;
            } else if (mini.value.includes('80')) {
                results.type = 'http';
                results.ipv4 = true;
            } else {
                console.log('mini::listen UNKNOWN', mini);
            }

            if (mini.value.includes('default_server')) {
                results.default = true;
            }
        } else if (mini.name === 'server_name') {
            // value: 'mydomain.com www.mydomain.com',
            results.hostnames = mini.value.split(' ');
        } else if (mini.name === 'ssl_certificate') {
            // value: '/etc/letsencrypt/live/mydomain.com/fullchain.pem',
            results.cert = mini.value;
        } else if (mini.name === 'ssl_certificate_key') {
            // value: '/etc/letsencrypt/live/mydomain.com/privkey.pem',
            results.certKey = mini.value;
        } else if (mini.name === 'ssl_protocols') {
            // value: 'TLSv1 TLSv1.1 TLSv1.2',
            results.sslProtocols = mini.value.split(' ');
        } else if (mini.name === 'ssl_ciphers') {
            results.sslCiphers = mini.value;
        } else if (mini.name === 'ssl_prefer_server_ciphers') {
            results.sslPreferServerCiphers = mini.value === 'on';
        } else if (mini.name === 'ssl_session_cache') {
            results.sslSessionCache = mini.value;
        } else if (mini.name === 'ssl_dhparam') {
            // value: '/etc/ssl/certs/dhparam.pem',
            results.sslDhParam = mini.value;
        } else if (mini.name === 'return') {
            // value: '301 https://$host$request_uri',
            results.return = mini.value;
        } else if (mini.name === 'location') {
            if (mini.value === '/') {
                results.root = mini.children.map(v => {
                    return {
                        key: v.name,
                        value: v.value
                    };
                });
            } else if (mini.value === '^~ /.well-known/acme-challenge/') {
                results.notAcme = mini.children;
            } else if (mini.value === '= /.well-known/acme-challenge/') {
                results.acme = mini.children;
            } else if (mini.value === '~ /.ht') {
                results.notHtaccess = mini.children;
            } else if (mini.value === '~ .php$') {
                results.phpProxy = mini.children;
            } else if (mini.value === '@rewrites') {
                results.rewrites = mini.children;
            } else {
                console.log('LOCATION UNKNOWN', mini.value);
                if (!results.locationsUnknown) {
                    results.locationsUnknown = [];
                }

                results.locationsUnknown.push(mini.children);
            }
        } else if (mini.name === 'root') {
            // value: '/srv/www/mydomain.com/public_html/',
            results.rootRoot = mini.value;
        } else if (mini.name === 'index') {
            // value: 'index.php index.html index.htm',
            results.index = mini.value;
        } else {
            console.log('mini', mini.name, mini.value);
        }
    }

    return results;
};

const applyAnalysisToResults = function (analysis, results) {
    // console.log('analysis', analysis);
    if (analysis.upstream) {
        const upstream = analysis.upstream;
        if (upstream.name && upstream.type && upstream.host) {
            //results.hasValidUpstream = true;
            const upstreamHost = upstream.host;
            // const upstreamHostSplit = upstreamHost.split(':');
            // const upstreamHostname = upstreamHostSplit[0];
            // const upstreamPort = upstreamHostSplit[1];
            results.upstream = upstreamHost;
        }
    }

    results.protocol = '';
    const https = analysis.https;
    if (https && https.type === 'https') {
        results.protocol += 'S';
        if (https.ipv6) {
            results.protocol += '6';
        }
        if (https.ipv4) {
            results.protocol += '4';
        }
        if (https.default) {
            results.protocol += 'd';
        }

        if (https.root && https.root.length) {
            for (let i = 0; i < https.root.length; i++) {
                const root = https.root[i];
                // console.log('ROOT SSL', root);
                if (root.key === 'root') {
                    results.root = root.value;
                }
            }
        }
        if (results.root === undefined && https.rootRoot) {
            results.root = https.rootRoot;
            results.rootRoot = true;
        }
        if (https.phpProxy) {
            results.phpProxy = true;
        }
    }

    results.protocol += ' ';
    const http = analysis.http;
    if (http && http.type === 'http') {
        results.protocol += 'H';
        if (http.ipv6) {
            results.protocol += '6';
        }
        if (http.ipv4) {
            results.protocol += '4';
        }
        if (http.default) {
            results.protocol += 'd';
        }
        if (http.root && http.root.length) {
            for (let i = 0; i < http.root.length; i++) {
                const root = http.root[i];
                // console.log('ROOT HTTP', root);
                if (root.key === 'root' && results.root === undefined) {
                    results.root = root.value;
                }
            }
        }
        if (results.root === undefined && http.rootRoot) {
            results.root = http.rootRoot;
            results.rootRoot = true;
        }
        if (results.phpProxy === undefined && http.phpProxy) {
            results.phpProxy = true;
        }
    }

    results.protocol = results.protocol.trim();

};

const handleParse = function (parsed) {
    const results = {};
    if (parsed.children && parsed.children.length) {
        const analysis = {};
        for (let i = 0; i < parsed.children.length; i++) {
            const block = parsed.children[i];
            if (block.name === 'upstream') {
                analysis.upstream = handleParseUpstreamBlock(block);
            } else if (block.name === 'server') {
                const serverBlockAnalysis = handleParseServerBlock(block);
                if (serverBlockAnalysis.type) {
                    analysis[serverBlockAnalysis.type] = serverBlockAnalysis;
                }
            }
        }
        applyAnalysisToResults(analysis, results);
    }
    return results;
};

const nginx = new sbxl.VirtualHostService({
    service: 'NGINX',
    sitesAvailableDir: '/etc/nginx/sites-available/',
    sitesEnabledDir: '/etc/nginx/sites-enabled/',
    storageFilename: 'nginx.json',
    memoryFilename: 'nginx.memory.json',
    enableSiteFn: (site, sitesAvailable, sitesEnabled) => {
    	return sbxl.util.exec('ln -s ' + sitesAvailable + ' ' + sitesEnabled).then(() => {
    		console.log('Successfully enabled nginx site', site);
    		return true;
    	});
    },
    deepAnalyze: function ({ name, contents }) {
        // console.log('dA', name);
        return parse(contents).then(parsed => {
            return handleParse(parsed);
        }).catch(e => {
            console.error('dA parsing error', e);
        });
    }
});
module.exports = nginx;
