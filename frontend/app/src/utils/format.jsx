
const formatEventData = (timestamp) => {
  const date = new Date(timestamp);


  if (isNaN(date.getTime())) {
    return { date: "", time: "" };
  }

  const formattedDate = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, 
  });

  return {
    date: formattedDate,
    time: formattedTime,
  };
};

export default formatEventData;