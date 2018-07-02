var fs = require('fs');
var _ = require('lodash');

const difference = (object, base) => {
  return _.transform(object, (result, value, key) => {
    if (!_.isEqual(value, base[key])) {
      result[key] = _.isObject(value) && _.isObject(base[key]) ? difference(value, base[key]) : value;
    }
  });
}

const checkDuplicate = (lead, otherLead) => {
  if ((lead._id == otherLead._id) || (lead.email == otherLead.email)) { return true }
  else { return false }
}

const dedupeLeads = (filename) => {
  fs.readFile(`./data/${filename}`, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }

    originalLeads = JSON.parse(data)["leads"];
    dupeGroups = groupDupes(originalLeads);
    arrayOfDupeGroups = Object.values(dupeGroups);

    finalLeads = {};

    for (var dupeGroup of arrayOfDupeGroups) {
      for (var lead of dupeGroup) {
        latestLeads = [];

        arrayOfDupeGroups.map(
          function(otherDupeGroup) {
            anyMatchingDupesBetweenGroups = !_.isEmpty(_.compact(otherDupeGroup.map(otherLead => checkDuplicate(lead, otherLead))));

            if (anyMatchingDupesBetweenGroups) {
              latestDupe = dupeGroup.slice(-1).pop();
              latestOtherDupe = otherDupeGroup.slice(-1).pop();

              latestDupeDate = new Date(latestDupe.entryDate);
              latestOtherDupeDate = new Date(latestOtherDupe.entryDate);

              if (latestDupeDate <= latestOtherDupeDate) {
                latestLeads.push(latestOtherDupe);
              } else {
                latestLeads.push(latestDupe);
              }
            }
          }
        );

        finalLead = _.orderBy(latestLeads, function(lead) { return new Date(lead.entryDate); }, "asc").pop();

        if (finalLeads[`${lead._id} at ${lead.email}`]) {
          finalLeads[`${lead._id} at ${lead.email}`].push(finalLead);
        } else {
          finalLeads[`${lead._id} at ${lead.email}`] = [finalLead];
        }
      }
    }

    output = originalLeads.map(function(lead) {
      console.log("MAPPING: \n", lead);

      mappedLead = finalLeads[`${lead._id} at ${lead.email}`].slice(-1).pop();
      console.log("TO: \n", mappedLead);

      changeset = difference(lead, mappedLead);
      console.log("CHANGES: \n", );

      Object.keys(changeset).map(function(key) {
        console.log(key, " from: ", lead[key]," to: ", mappedLead[key]);
      });

      console.log("\n\n");

      return finalLeads[`${lead._id} at ${lead.email}`].slice(-1).pop();
    });

    console.log("OUTPUT: \n", _.uniqWith(output, _.isEqual));
  });
}

const groupDupes = (leads) => {
  return leads.reduce( function(groupedLeads, currentLead) {
    groupedLeads[`${currentLead._id} at ${currentLead.email}`] = detectDupes(currentLead, leads, Object.values(groupedLeads));
    return groupedLeads;
  }, {} );
}

const detectDupes = (lead, leads, currentDupes) => {
  newDupes = leads.filter(otherLead => checkDuplicate(lead, otherLead));
  return _.orderBy(newDupes, function(lead) { return new Date(lead.entryDate); }, "asc");
}

module.exports = { dedupeLeads }
