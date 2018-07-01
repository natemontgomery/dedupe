var fs = require('fs');
var _ = require('lodash');

const checkDuplicate = (lead, otherLead) => {
  if ((lead._id == otherLead._id) || (lead.email == otherLead.email)) { return true }
  else { return false }
}

const dedupeLeads = (filename) => {
  fs.readFile(`./data/${filename}`, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }

    dupeGroups = groupDupes(JSON.parse(data)["leads"]);
    dedupedLeads = Object.values(dupeGroups);

    finalLeads = {};
    finalLeads["leads"] = _.compact(dedupedLeads.map(leads => leads.pop()));

    console.log(finalLeads)
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
  orderedDupes = _.orderBy(newDupes, function(lead) { return new Date(lead.entryDate); }, "asc");

  // This nested search cross references existing duplication groups against
  // the new duplication group we would create.
  for (var existingDupeGroup of currentDupes) {
    for (var newLead of orderedDupes) {
      matchingDupes = existingDupeGroup.filter(oldLead => checkDuplicate(oldLead, newLead));

      if (!_.isEmpty(matchingDupes)) {
        latestNewDupe = new Date(orderedDupes.pop());
        latestExistingDupe = new Date(matchingDupes.pop());

        if (latestExistingDupe.entryDate > latestNewDupe.entryDate) {
          console.log("Mapping Lead:");
          console.log(newLead);
          console.log("To:");
          console.log(matchingDupes.pop());
          console.log("\n");
        } else {
          existingDupeGroup.push(latestNewDupe);
        }

        return [];
      }
    }
  }

  return orderedDupes;
}

module.exports = { dedupeLeads }
