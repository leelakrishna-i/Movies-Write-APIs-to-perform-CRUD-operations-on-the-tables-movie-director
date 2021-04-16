const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "moviesData.db");

app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is Running at http://localhost/3000/");
    });
  } catch (error) {
    console.log(`Error message ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertMovieDbObjectToReadableObject = (DbObject) => {
  return {
    movieId: DbObject.movie_id,
    directorId: DbObject.director_id,
    movieName: DbObject.movie_name,
    leadActor: DbObject.lead_actor,
  };
};

const convertDirectorDbObjectToRequiredObject = (DbObject) => {
  return {
    directorId: DbObject.director_id,
    directorName: DbObject.director_name,
  };
};

//get all movie Names
app.get("/movies/", async (request, response) => {
  const allMovieNameQuery = `SELECT movie_name FROM movie`;
  const allMovieNames = await db.all(allMovieNameQuery);
  response.send(
    allMovieNames.map((eachName) => ({ movieName: eachName.movie_name }))
  );
});

//post new movie details
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const createNewMovieDetailsQuery = `
    INSERT INTO
    movie (director_id,movie_name,lead_actor)
    VALUES ('${directorId}','${movieName}','${leadActor}');
    `;
  await db.run(createNewMovieDetailsQuery);
  response.send("Movie Successfully Added");
});

//get movie based od movieID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieOnIdQuery = `
        SELECT * FROM movie WHERE movie_id = ${movieId}
    `;
  const Details = await db.get(getMovieOnIdQuery);

  response.send(convertMovieDbObjectToReadableObject(Details));
});

//update movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateDetailsQuery = `
        UPDATE
        movie
        SET
        director_id='${directorId}',
        movie_name='${movieName}',
        lead_actor='${leadActor}'
        WHERE 
        movie_id=${movieId};
    `;
  await db.run(updateDetailsQuery);
  response.send("Movie Details Updated");
});

//delete on movie id
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteDetailsQuery = `
        DELETE FROM movie WHERE movie_id=${movieId};
    `;
  await db.run(deleteDetailsQuery);
  response.send("Movie Removed");
});

//get director details
app.get("/directors/", async (request, response) => {
  const getDirectorDetailsQuery = `
        SELECT * FROM director
    `;
  const directorDetails = await db.all(getDirectorDetailsQuery);
  response.send(
    directorDetails.map((eachDetail) =>
      convertDirectorDbObjectToRequiredObject(eachDetail)
    )
  );
});

//get specific movie on director id
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDetailsQuery = `
        SELECT movie_name FROM movie WHERE director_id=${directorId};
    `;
  const moviesList = await db.all(getDetailsQuery);
  response.send(
    moviesList.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
