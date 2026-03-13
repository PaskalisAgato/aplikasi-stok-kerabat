const fs = require('fs');
const path = require('path');
const appsDir = path.join(process.cwd(), 'apps');
const apps = fs.readdirSync(appsDir);

apps.forEach(app => {
  const mainPathTs = path.join(appsDir, app, 'src', 'main.tsx');
  const mainPathJs = path.join(appsDir, app, 'src', 'main.jsx');
  const mainPath = fs.existsSync(mainPathTs) ? mainPathTs : (fs.existsSync(mainPathJs) ? mainPathJs : null);

  if (mainPath) {
    let content = fs.readFileSync(mainPath, 'utf8');
    if (!content.includes('QueryProvider')) {
       // Add import
       if (!content.includes("import { QueryProvider } from '@shared/QueryProvider'")) {
         content = "import { QueryProvider } from '@shared/QueryProvider'\n" + content;
       }
       // Wrap App
       // Look for <App /> or <App/>
       if (content.includes('<App />')) {
         content = content.replace('<App />', '<QueryProvider>\n      <App />\n    </QueryProvider>');
       } else if (content.includes('<App/>')) {
         content = content.replace('<App/>', '<QueryProvider>\n      <App />\n    </QueryProvider>');
       }
       
       fs.writeFileSync(mainPath, content, 'utf8');
       console.log(`Wrapped ${app} in QueryProvider`);
    }
  }
});
