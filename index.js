const http = require('http');
const fs = require('fs');
const { default: ical, ICalEvent } = require('ical-generator');

const hostname = '127.0.0.1';
const port = 3000;

/* timetable logic */

/* recieves calendar json and creates list of events.*/
function parseCalJson(json) {
    let events = [];
    let cal = new ical(); // needed for timezone and related calendar data to be correct

    for (let _event of json['Results']) {//for every event in the timetable
        events.push(new ICalEvent(data={
            start: _event['StartDateTime'],
            end: _event['EndDateTime'],
            summary: _event['Name'],
            description: json['Name'],
            location: _event['Location']
        }, cal));
    }
    return events;
}

/* receive a list of timetables, each containing many events, return calendar.*/
function createCal(arr) {
    let cal = new ical();
    for (let category of arr) {
        for (let event of category) {
            cal.createEvent(event);
        }
    }
    return cal;
}

/* params should be a URLSearchParams object */
async function timetables(response, params) {
    let selections = params.get('selections').split(',') // array of calendar ['type__category_category']
    let timetables = await Promise.all(selections.map(async selection => {
        let type = selection.split('__')[0];
        let categories = selection.split('__')[1];
        categories = categories.replace('_', ',');
        let result = await fetch(`https://timetable.swansea.cymru/${type}/${categories}`);
        return await result.json();
    }));

    let unpackedJson = [].concat(...timetables.map(t => t.CategoryEvents));

    unpackedJson = unpackedJson.map(timetable => {
        return parseCalJson(timetable);
    })

    let calendar = createCal(unpackedJson);

    serveGeneric(response, calendar.toString(), 'text/calendar');
}

/* web logic */

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

function notFound(response) {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/plain');
    response.end('404: not found.');
}

const server = http.createServer((req, res) => {
    const route = new URL(req.protocol + '://' + req.headers.host + req.url);
    if (route.pathname == '/') {
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
