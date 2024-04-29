export default defineEventHandler(async (event) => {
  try {
    const getRule = await prisma.parking_season_rule.findFirst({
      where: {
        parking_season_rule_id: 1,
      },
      select: {
        parking_season_rule_id: true,
        als_period: true,
        multiple_entry_period: true,
        rule_status: true,
      },
    });

    if (!getRule) {
      return {
        statusCode: 404,
        message: "Rule not found",
      };
    }

    const remapRule = {
      ruleID: getRule.parking_season_rule_id,
      alsPeriod: getRule.als_period,
      multipleEntryPeriod: getRule.multiple_entry_period,
      status: getRule.rule_status,
    };

    return {
      statusCode: 200,
      message: "Success get Parking Season Rule",
      data: remapRule,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
