# NYC Parks Public Restrooms Interactive Map

## Problem Discovering

STOP typing "public bathroom near me" in Google Maps
Wouldn't be mad when you are shopping at New York, specially at Manhattan, you find yourself a need of using the bathroom? It only to be overwhelmed by the dense crowds and lack of public facilities. Instead USE my application nyc-restroom-map to give yourself a plus

## Project Overview

This repository hosts a single-page web application that maps all public restrooms located in NYC parks. Users can effortlessly filter restrooms by borough or utilize the search functionality. Selecting a restroom on the map displays detailed information, nearby venues, and images of the surrounding area.

## Live Application

Access the live application at [NYC Restroom Map](https://nyc-restroom-map.herokuapp.com/).

## Repository Structure

The project is organized as follows:

- `model.js`: Contains the processed data of restroom locations along with latitude, longitude, and Google Place IDs.
- `dist/`: Contains the distribution files for the web application.

## Data Compilation

### Phase 1: Data Sourcing

The necessary data for NYC parks and restrooms was compiled from the following sources:

- NYC Open Data API: Retrieved a JSON file of all public restrooms using the [Directory Of Toilets In Public Parks API](https://data.cityofnewyork.us/Recreation/Directory-Of-Toilets-In-Public-Parks/hjae-yuav).
- Google Geocoding API: Mapped each restroom location to precise latitude and longitude coordinates, and associated each with a unique Google place_id.

### Phase 2: Interactive Map Construction

#### Development Dependencies

- Node.js and npm
- Bower
- Gulp

#### Building the Development Environment

To construct the development version of the application:

 Install all dependencies listed in `package.json`:
   npm install
   bower update
   gulp
   Open the file /dist/index.html in a web browser to view the application.


#### Resources and Documentation

The development of this application was supported by the following documentation:

Udacity: Educational platform providing coding courses.
KnockoutJS Documentation: Framework documentation.
Foursquare API Documentation: Venue data API.
Google Maps API Documentation: Mapping services API.
Yeoman Generator for KnockoutJS: Project scaffolding.

#### Acknowledgements
NYC Open Data for providing the public restroom information.
Google Maps Platform for geocoding services and map functionalities.
The Foursquare API for enriching restroom data with local venues information.





