# Chicago Intersections Finder

## Project startup notes

This is a single page web-app that allows a user to enter the name of an intersection, e.g.

    "N ABERDEEN ST & N OGDEN AVE"

The app will then look at the data in `static/chicago-intersections.json` , and if there is a matching intersection record, the app will display the geo coordinates of that intersection in text, and also as a marker on an interactive map e.g. openstreetmap.

The input box should be "smart" enough so that the user can type in a partial match and be presented with an interactively filtered autocomplete dropdown.

For example, if the user types in "Aberdeen and Og", the autocomplete filter should:

- normalize every token to uppercase
- ignore "AND" and "%"
- return each intersection that contains all of the tokens entered so far

So "Aberdeen and Og" should return:

- "N ABERDEEN ST & N OGDEN AVE"
- "N ABERDEEN ST & S OGDEN PL"
- "S ABERDEEN AVE & W OGILVY ST"
