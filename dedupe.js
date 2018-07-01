const program = require('commander');
const { dedupeLeads } = require('./ops');

program
  .version('0.0.1')
  .description('Deduper for Marketo Code Challenge');

program
  .command('dedupe <filename>')
  .alias('d')
  .description('Dedupe given file in `data` directory containing Leads in JSON format.\nFile contents must have shape: { "leads": [{\n\t"firstName": "foo",\n\t"lastName": "bar",\n\t"address": "baz",\n\t"entryDate": "2014-05-07T17:30:20+00:00"\n}] }')
  .action((filename) => {
    dedupeLeads(filename);
  });

program.parse(process.argv);
