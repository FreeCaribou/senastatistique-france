import { createServer } from 'node:http';

const server = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (req.url === '/') {
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
        const actualSenatorCall = await fetch('https://www.senat.fr/api-senat/senateurs.json');
        const actualSenators = await actualSenatorCall.json();

        /**
         * Object all senator:
         * Matricule -> the id
         * Date_naissance -> date like "yyyy/mm/dd 00:00:00"
         */
        const allSenatorCall = await fetch('https://data.senat.fr/data/senateurs/ODSEN_GENERAL.json');
        const allSenators = (await allSenatorCall.json()).results;

        // console.log('the senator', actualSenators);

        // label / count
        const civilites = [];
        // label / code / count
        const jobCategories = [];
        // label / code / count
        const groupes = [];

        let oldestSenator;
        let youngestSenator;
        const oldAges = [];

        actualSenators.forEach(senator => {
            const senatorOtherDetail = allSenators.find(x => x.Matricule === senator.matricule);
            const birthDate = new Date(senatorOtherDetail.Date_naissance);
            const now = new Date();
            let age = now.getFullYear() - birthDate.getFullYear();
            const monthNow = now.getMonth();
            const monthBirth = birthDate.getMonth();
            if (monthNow < monthBirth || (monthNow === monthBirth && now.getDate() < birthDate.getDate())) {
                age--;
            }
            senator.birthDate = birthDate;
            senator.age = age;
            oldAges.push(age);
            if (!oldestSenator) {
                oldestSenator = senator;
            } else if (oldestSenator.birthDate > birthDate) {
                oldestSenator = senator;
            }
            if (!youngestSenator) {
                youngestSenator = senator;
            } else if (youngestSenator.birthDate < birthDate) {
                youngestSenator = senator;
            }

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
        const head = `<head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>SenaSTatistique France</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
        </head>`;

        const title = "<h1 class='mb-5'>Des stats sur le Sénat français et ses actuels sénateurs</h1>";

        const civilitesTitle = "<h2>Civilités</h2>";
        const beginTableCivilites = "<table class='table mb-3'><thead class='table-light'><tr><th>Civilité</th><th>Nombre</th></tr></thead>";
        const dataTableCivilites = civilites.map(c => `<tr><td>${c.label}</td><td>${c.count}</td></tr>`).join('');
        const endTableCivilites = "</table>";
        const tableCivilites = civilitesTitle + beginTableCivilites + dataTableCivilites + endTableCivilites;

        const jobCategoriesTitle = "<h2>Catégories professionnelles</h2>";
        const beginTableJobCategories = "<table class='table mb-3'><thead class='table-light'><tr><th>Libellé</th><th>Nombre</th></tr></thead>";
        const dataTableJobCategories = jobCategories.map(c => `<tr><td>${c.label}</td><td>${c.count}</td></tr>`).join('');
        const endTableJobCategories = "</table>";
        const tableJobCategories = jobCategoriesTitle + beginTableJobCategories + dataTableJobCategories + endTableJobCategories;

        const groupesTitle = "<h2>Groupes politiques</h2>";
        const beginTableGroupes = "<table class='table mb-3'><thead class='table-light'><tr><th>Libellé</th><th>Nombre</th></tr></thead>";
        const dataTableGroupes = groupes.map(c => `<tr><td>${c.label}</td><td>${c.count}</td></tr>`).join('');
        const endTableGroupes = "</table>";
        const tableGroupes = groupesTitle + beginTableGroupes + dataTableGroupes + endTableGroupes;

        const youngestSenatorHtml = `<p>Le plus jeune, ${youngestSenator.nom} ${youngestSenator.prenom}, ${youngestSenator.age} ans, né ${youngestSenator.birthDate.toLocaleDateString('fr')}</p>`;
        const oldestSenatorHtml = `<p>Le plus vieux, ${oldestSenator.nom} ${oldestSenator.prenom}, ${oldestSenator.age} ans, né ${oldestSenator.birthDate.toLocaleDateString('fr')}</p>`;
        const middleAgeHtml = `<p>La moyenne d'age est de ${Math.floor(oldAges.reduce((acc, val) => acc + val, 0) / oldAges.length)} ans</p>`;
        const olderThanPensionHtml = `<p>${oldAges.filter(x => x >= 65).length} senateurs et sénatrices sont au dessous de l'age de la retraire de 65 ans (sur ${oldAges.length} sénateur ou sénatrices)</p>`;
        const ageHtml = `<h2>Ages</h2>${youngestSenatorHtml}${oldestSenatorHtml}${middleAgeHtml}${olderThanPensionHtml}`;

        const footer = `<footer class="mt-5 mb-3">
            <p><a href="https://data.senat.fr">Donnée officiel de l'open data du Sénat français</a></p>
            <p><a href="https://github.com/FreeCaribou/senaSTatistique-france">Code source</a></p>
        </footer>`;

        const jsExtScript = `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>`;

        const htmlBuild = `<html lang="fr">
        ${head}<body>
        <div class="container">
        ${title}${tableCivilites}${tableJobCategories}${tableGroupes}${ageHtml}${footer}
        </div>
        ${jsExtScript}
        </body></html>`;

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