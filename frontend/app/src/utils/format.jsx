const formatEventData = (time) => {
  const date = new Date(time);

  const formattedDate = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    ...time,
    date: formattedDate,
    time: `${timeStr}`
  };
};

export default formatEventData