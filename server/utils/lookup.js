async function getLookupList(code) {
  try {
    const getLookup = await prisma.lookup.findFirst({
      where: {
        lookupCode: code,
      },
      select: {
        lookupID: true,
      },
    });

    if (!getLookup) return false;

    // Get Child for that lookup
    const lookupData = await prisma.lookup.findMany({
      where: {
        lookupRefCode: getLookup.lookupID.toString(),
        lookupStatus: "ACTIVE",
      },
      select: {
        lookupID: true,
        lookupTitle: true,
        lookupValue: true,
        lookupImage: true,
      },
    });

    if (!lookupData || lookupData.length === 0) return false;

    const renamedLookupData = lookupData.map((ld) => {
      return {
        id: ld.lookupID,
        name: ld.lookupTitle,
        value: ld.lookupValue,
        image: ld.lookupImage,
      };
    });

    return renamedLookupData;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getLookup(id, refCode) {
  try {
    const getLookup = await prisma.lookup.findFirst({
      where: {
        lookupID: parseInt(id),
        lookupRefCode: refCode,
        lookupStatus: "ACTIVE",
      },
      select: {
        lookupTitle: true,
        lookupValue: true,
      },
    });

    if (!getLookup) {
      return null;
    }

    return {
      name: getLookup.lookupTitle,
      value: getLookup.lookupValue,
    };
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getLookupListOptions(code) {
  try {
    const getLookup = await prisma.lookup.findFirst({
      where: {
        lookupCode: code,
      },
      select: {
        lookupID: true,
      },
    });

    if (!getLookup) return false;

    // Get Child for that lookup
    const lookupData = await prisma.lookup.findMany({
      where: {
        lookupRefCode: getLookup.lookupID.toString(),
        lookupStatus: "ACTIVE",
      },
      select: {
        lookupID: true,
        lookupTitle: true,
        lookupValue: true,
      },
    });

    if (!lookupData || lookupData.length === 0) return false;

    const renamedLookupData = lookupData.map((ld) => {
      return {
        id: ld.lookupID,
        name: ld.lookupTitle,
        value: ld.lookupValue,
      };
    });

    return renamedLookupData;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export { getLookupList, getLookup, getLookupListOptions };
