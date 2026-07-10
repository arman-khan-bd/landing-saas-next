const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const subdomainDir = path.join(__dirname, '..', 'src', 'app', '[subdomain]');
if (!fs.existsSync(subdomainDir)) {
  console.log("Subdomain directory not found.");
  process.exit(1);
}

const files = walk(subdomainDir);

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace imports
  content = content.replace(/import\s*\{\s*useFirestore\b[^\}]*\}\s*from\s*["']@\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";');
  content = content.replace(/import\s*\{\s*useFirestore,\s*useUser\b[^\}]*\}\s*from\s*["']@\/firebase["'];?/g, 'import { useSupabaseClient, useUser } from "@/supabase";');
  content = content.replace(/import\s*\{\s*useUser,\s*useFirestore\b[^\}]*\}\s*from\s*["']@\/firebase["'];?/g, 'import { useSupabaseClient, useUser } from "@/supabase";');
  content = content.replace(/import\s*db\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";');
  content = content.replace(/import\s*\{\s*db\s*\}\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";');
  content = content.replace(/import\s*\{\s*db,\s*auth\s*\}\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";');
  content = content.replace(/import\s*\{\s*auth,\s*db\s*\}\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";');
  
  // Strip firebase imports
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*["']firebase\/firestore["'];?/g, '');
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*["']firebase\/auth["'];?/g, '');

  // Strip error/emitter imports if they were Firebase ones
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*["']@\/firebase\/error-emitter["'];?/g, '');
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*["']@\/firebase\/errors["'];?/g, '');

  // Rename variable initializations
  content = content.replace(/\bconst\s+firestore\s*=\s*useFirestore\(\);?/g, 'const supabase = useSupabaseClient();');
  content = content.replace(/\bconst\s+db\s*=\s*useFirestore\(\);?/g, 'const supabase = useSupabaseClient();');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${path.basename(filePath)}`);
  }
});

console.log("Subdomain imports migration script finished.");
