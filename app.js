const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT * 
    FROM state
    ORDER BY state_id;
    `;
  const states = await db.all(getStateQuery);
  const ans = (states) => {
    return {
      stateId: states.state_id,
      stateName: states.state_name,
      population: states.population,
    };
  };
  response.send(states.map((each) => ans(each)));
});

//API 2
//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};
    `;
  const states = await db.get(getStateQuery);
  const ans = (states) => {
    return {
      stateId: states.state_id,
      stateName: states.state_name,
      population: states.population,
    };
  };
  response.send(ans(states));
});

//API 3
//Create a district in the district table, district_id is auto-incremented
app.post("/districts/", async (request, response) => {
  const districtsQuery = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsQuery;
  const newDistrict = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}

    )`;
  await db.run(newDistrict);
  response.send("District Successfully Added");
});

// API 4
//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
    `;
  const district = await db.get(getDistrictQuery);
  const ans = (district) => {
    return {
      districtId: district.district_id,
      districtName: district.district_name,
      stateId: district.state_id,
      cases: district.cases,
      cured: district.cured,
      active: district.active,
      deaths: district.deaths,
    };
  };
  response.send(ans(district));
});

//API 5
//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//API 6
//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `
    UPDATE district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}

    `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatistics = `
    SELECT 
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    FROM district
    GROUP BY state_id = ${stateId};
    `;
  const stats = await db.get(getStatistics);
  console.log(stats);
  response.send(stats);
});

//API 8
//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStates = `
    SELECT state_name as stateName
    FROM district INNER JOIN state ON district.state_id = state.state_id
    WHERE district.district_id = ${districtId};

    `;
  const states = await db.get(getStates);
  response.send(states);
});

module.exports = app;
