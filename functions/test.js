const handler = (event) => {
  try {
    console.log(event);
    return {
      status: 200,
      message: "Its working",
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "Some error occurred",
    };
  }
};

module.exports = {
  handler,
};
