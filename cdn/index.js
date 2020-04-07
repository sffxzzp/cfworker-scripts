addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
})

var usage = `<h1>Usage</h1><ul><li>/py<ul><li>/py/python_\${ver}.zip<ul><li>Download a zipped win32 embed python file with specified version.</li></ul></li><li>/py/get-pip.py<ul><li>Download get-pip.py</li></ul></li></ul></li><li>/gh<ul><li>/gh/:user/:repo/:filename<ul><li>Download specified file in target repo&#39;s latest release.</li></ul></li><li>/gh/:user/:repo/:tag/:filename<ul><li>Download specified file in target repo&#39;s release which has the same tag name.</li></ul></li></ul></li></ul>`;

async function handleRequest(request) {
    var reqUrl = new URL(request.url);
    var pathname = reqUrl.pathname.split('/');
    if (pathname[1] == 'py') {
        if (/python_.*?\.zip/.test(pathname[2])) {
            var pyver = pathname[2].replace('python_', '').replace('.zip', '');
            var url = `https://www.python.org/ftp/python/${pyver}/python-${pyver}-embed-win32.zip`;
            return fetch(url, {cf: { cacheEverything: true, cacheTtl: 3600 }});
        } else if (pathname[2] == 'get-pip.py') {
            var url = 'https://bootstrap.pypa.io/get-pip.py';
            return fetch(url, {cf: { cacheEverything: true, cacheTtl: 3600 }});
        }
        else {
            return new Response(usage, { status: 404, headers: {'Content-Type':'text/html; charset=utf-8'} });
        }
    }
    else if (pathname[1] == 'gh') {
        var jsonurl, targetfile;
        if (pathname.length == 5) {
            jsonurl = `https://api.github.com/repos/${pathname[2]}/${pathname[3]}/releases/latest`;
            targetfile = pathname[4];
        } else if (pathname.length == 6) {
            jsonurl = `https://api.github.com/repos/${pathname[2]}/${pathname[3]}/releases/tags/${pathname[4]}`;
            targetfile = pathname[5];
        }
        var jdata = await fetch(jsonurl, {headers: {'User-Agent': 'CloudFlare-Workers'}});
        jdata = await jdata.json();
        if ('assets' in jdata) {
            var assets = [];
            for (let i in jdata.assets) {
                let ass = jdata.assets[i];
                if (targetfile == ass.name) {
                    return fetch(ass.browser_download_url, {cf: { cacheEverything: true, cacheTtl: 3600 }});
                }
            }
            return new Response(usage, { status: 404, headers: {'Content-Type':'text/html; charset=utf-8'} });
        }
        else {
            return new Response(JSON.stringify(jdata), { status: 200 });
        }
    }
    else {
        return new Response(usage, { status: 200, headers: {'Content-Type':'text/html; charset=utf-8'} });
    }
}
