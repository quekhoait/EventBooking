export const logError = (err, context = "Unknown") => {
  console.error(`\n===== ERROR [${context}] =====`);

  if (err?.response) {
    console.error("Type     : API Response Error");
    console.error("Status   :", err.response.status);
    console.error("URL      :", err.config?.url);
    console.error("Method   :", err.config?.method?.toUpperCase());
    console.error("Data sent:", err.config?.data);
    console.error("Response :", JSON.stringify(err.response.data, null, 2));
  } else if (err?.request) {
    console.error("Type     : No Response (network/timeout)");
    console.error("Request  :", err.request);
  } else if (err instanceof Error) {
    console.error("Type     : Runtime Error");
    console.error("Message  :", err.message);
    console.error("Stack    :", err.stack);
  } else {
    console.error("Type     : Unknown Error");
    console.error("Raw      :", err);
  }

  console.error("==============================\n");
};