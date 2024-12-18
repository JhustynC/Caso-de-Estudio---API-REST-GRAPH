import axios from "axios";
import { request, gql } from "graphql-request";

const REST_BASE_URL = "https://rickandmortyapi.com/api";
const GRAPHQL_BASE_URL = "https://rickandmortyapi.com/graphql";

interface Metrics {
  responseTime: number;
  payloadSize: number;
  requestCount: number;
}

// Función para medir tiempo de respuesta
async function measureRestAPI(): Promise<Metrics> {
  const startTime = performance.now();

  // Solicitar datos del personaje
  const characterResponse = await axios.get(`${REST_BASE_URL}/character/1`);
  const character = characterResponse.data;

  // Solicitar datos de episodios
  const episodeResponses = await Promise.all(
    character.episode.map((url: string) => axios.get(url))
  );
  const episodes = episodeResponses.map((response) => response.data);

  const endTime = performance.now();

  // Calcular tamaño del payload
  const payloadSize =
    JSON.stringify(character).length +
    episodes.reduce((total, episode) => total + JSON.stringify(episode).length, 0);

  return {
    responseTime: endTime - startTime,
    payloadSize,
    requestCount: 1 + episodes.length,
  };
}

async function measureGraphQLAPI(): Promise<Metrics> {
  const startTime = performance.now();

  // Hacer consulta GraphQL
  const query = gql`
    {
      character(id: 1) {
        name
        status
        episode {
          name
          air_date
        }
      }
    }
  `;

  const response = await request(GRAPHQL_BASE_URL, query);
  const endTime = performance.now();

  // Calcular tamaño del payload
  const payloadSize = JSON.stringify(response).length;

  return {
    responseTime: endTime - startTime,
    payloadSize,
    requestCount: 1,
  };
}

// Función principal para comparación
async function compareAPIs() {
  console.log("Comparando APIs...");

  console.log("\n--- REST API ---");
  const restMetrics = await measureRestAPI();
  console.log(`Tiempo de respuesta: ${restMetrics.responseTime.toFixed(2)} ms`);
  console.log(`Tamaño del payload: ${restMetrics.payloadSize} bytes`);
  console.log(`Cantidad de solicitudes: ${restMetrics.requestCount}`);

  console.log("\n--- GraphQL API ---");
  const graphqlMetrics = await measureGraphQLAPI();
  console.log(`Tiempo de respuesta: ${graphqlMetrics.responseTime.toFixed(2)} ms`);
  console.log(`Tamaño del payload: ${graphqlMetrics.payloadSize} bytes`);
  console.log(`Cantidad de solicitudes: ${graphqlMetrics.requestCount}`);
}

compareAPIs().catch((error) => {
  console.error("Error al comparar APIs:", error);
});
