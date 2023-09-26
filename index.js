/* TODO;

*/

const http = require('http');
const fs = require('fs');
const { default: ical } = require('ical-generator');

const hostname = '127.0.0.1';
const port = 3000;


function serveGeneric(response, text, mimetype) {
    response.statusCode = 200;
    response.setHeader('Content-Type', mimetype);
    response.end(text);
}

function serveFile(response, filePath, mimetype='text/plain') {
    response.statusCode = 200;
    response.setHeader('Content-Type', mimetype);
    fs.createReadStream(filePath).pipe(response);
}


/* params should be a URLSearchParams object */
async function timetables(response, params) {
    let typeID = params.get('selections').split('__')[0];
    let categoriesID = params.get('selections').split('__')[1].split('_').join(',');
    let calendar = ical();
    let apiPath = `https://timetable.swansea.cymru/${typeID}/${categoriesID}`;
    let timetable = await (await fetch(apiPath)).json();

    for (let category of timetable['CategoryEvents']) {
        for (let _event of category['Results']) {
            calendar.createEvent({
                start: _event['StartDateTime'],
                end: _event['EndDateTime'],
                summary: _event['Name'],
                description: timetable['Name'],
                location: _event['Location']
            });
        }
    }
    serveGeneric(response, calendar.toString(), 'text/plain');
}

function notFound(response) {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/plain');
    response.end('404: not found.');
}

const server = http.createServer((req, res) => {
    const route = new URL(req.protocol + '://' + req.headers.host + req.url);
    if (route.pathname == '/') {
        // serveGeneric(res, home, 'text/html');
        serveFile(res, './frontend/index.html', 'text/html');
    } else if (route.pathname == '/timetables') {
        timetables(res, route.searchParams);
    } else if (route.pathname == '/style.css') {
        serveFile(res, './frontend/style.css', 'text/css')
    } else {
        notFound(res);
    }
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
})

