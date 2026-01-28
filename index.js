import { createServer } from 'node:http';

const server = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (req.url === '/') {
        // Throw error if not accessible
        const actualSenatorCall = await fetch('https://www.senat.fr/api-senat/senateurs.json');
        const actualSenators = await actualSenatorCall.json();

        /**
         * Object actual senator:
         * matricule -> like an id
         * nom -> name
         * prenom -> first name
         * civilite -> M., Mme
         * url -> link the detail
         * urlAvatar -> link to his picture
         * groupe -> {code/libelle/ordre} the political groupe
         * circonscription -> the "canton"
         * categorieProfessionnelle -> job category
         * organismes -> {code/type/libelle/ordre}[] the work group in the senat where she/he is
         */

        // console.log('the senator', actualSenators);

        // label / count
        const civilites = [];
        // label / code / count
        const jobCategories = [];
        // label / code / count
        const groupes = [];

        actualSenators.forEach(senator => {
            const civiliteIndex = civilites.findIndex(x => x.label === senator.civilite);
            if (civiliteIndex > -1) {
                civilites[civiliteIndex].count++;
            } else {
                civilites.push({ label: senator.civilite, count: 1 });
            }

            const jobCategoryIndex = jobCategories.findIndex(x => x.code === senator.categorieProfessionnelle.code);
            if (jobCategoryIndex > -1) {
                jobCategories[jobCategoryIndex].count++;
            } else {
                jobCategories.push({
                    label: senator.categorieProfessionnelle.libelle,
                    code: senator.categorieProfessionnelle.code,
                    count: 1
                });
            }

            const groupeIndex = groupes.findIndex(x => x.code === senator.groupe.code);
            if (groupeIndex > -1) {
                groupes[groupeIndex].count++;
            } else {
                groupes.push({
                    label: senator.groupe.libelle,
                    code: senator.groupe.code,
                    count: 1
                });
            }
        });

        civilites.sort((a, b) => b.count - a.count);
        jobCategories.sort((a, b) => b.count - a.count);
        groupes.sort((a, b) => b.count - a.count);

        // Build of the html
        const title = "<h1>Des stats sur le Sénat français et ses actuels sénateurs</h1>";

        const civilitesTitle = "<h2>Civilités:</h2>";
        const beginTableCivilites = "<table><tr><th>Civilité</th><th>Nombre</th></tr>";
        const dataTableCivilites = civilites.map(c => `<tr><td>${c.label}</td><td>${c.count}</td></tr>`).join('');
        const endTableCivilites = "</table>";
        const tableCivilites = civilitesTitle + beginTableCivilites + dataTableCivilites + endTableCivilites;

        const jobCategoriesTitle = "<h2>Catégories professionnelles:</h2>";
        const beginTableJobCategories = "<table><tr><th>Libellé</th><th>Nombre</th></tr>";
        const dataTableJobCategories = jobCategories.map(c => `<tr><td>${c.label}</td><td>${c.count}</td></tr>`).join('');
        const endTableJobCategories = "</table>";
        const tableJobCategories = jobCategoriesTitle + beginTableJobCategories + dataTableJobCategories + endTableJobCategories;

        const groupesTitle = "<h2>Groupes politiques:</h2>";
        const beginTableGroupes = "<table><tr><th>Libellé</th><th>Nombre</th></tr>";
        const dataTableGroupes = groupes.map(c => `<tr><td>${c.label}</td><td>${c.count}</td></tr>`).join('');
        const endTableGroupes = "</table>";
        const tableGroupes = groupesTitle + beginTableGroupes + dataTableGroupes + endTableGroupes;

        const htmlBuild = title + tableCivilites + tableJobCategories + tableGroupes;

        // res.end(JSON.stringify(actualSenator));
        res.end(htmlBuild);
    } else {
        res.end('Hello World!\nHehe');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}`);
});