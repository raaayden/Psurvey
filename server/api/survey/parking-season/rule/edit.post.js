export default defineEventHandler(async (event) => {
  try {
    const { ruleID, alsPeriod, multipleEntryPeriod, status } = await readBody(
      event
    );

    console.log("ruleID: ", ruleID);
    console.log("alsPeriod: ", alsPeriod);
    console.log("multipleEntryPeriod: ", multipleEntryPeriod);
    console.log("status: ", status);

    if (!ruleID || !alsPeriod || !multipleEntryPeriod || !status) {
      return {
        statusCode: 400,
        message: "Invalid Request",
      };
    }

    const updateRule = await prisma.parking_season_rule.update({
      where: {
        parking_season_rule_id: ruleID,
      },
      data: {
        als_period: parseInt(alsPeriod),
        multiple_entry_period: parseInt(multipleEntryPeriod),
        rule_status: status,
      },
    });

    if (!updateRule) {
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }

    return {
      statusCode: 200,
      message: "Success edit Parking Season Rule",
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
