$files = Get-ChildItem -Path "src\app" -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    # Fix @/lib/firebase imports
    $content = $content -replace 'import \{ auth, db \} from "@/lib/firebase";', 'import { supabase } from "@/lib/supabase";'
    $content = $content -replace 'import \{ db \} from "@/lib/firebase";', 'import { supabase } from "@/lib/supabase";'
    $content = $content -replace 'import \{ auth \} from "@/lib/firebase";', 'import { supabase } from "@/lib/supabase";'

    # Replace remaining Firestore variable references in function bodies
    $content = $content -replace '\bconst firestore = useSupabaseClient\(\);', 'const supabase = useSupabaseClient();'
    $content = $content -replace '\bif \(!firestore\)', 'if (!supabase)'
    $content = $content -replace '\bif \(firestore\)', 'if (supabase)'
    $content = $content -replace '\bif \(user \&\& firestore\)', 'if (user && supabase)'
    $content = $content -replace '\[user, firestore\]', '[user, supabase]'
    $content = $content -replace '\[firestore\]', '[supabase]'

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Pass2 Updated: $($file.Name)"
    }
}
Write-Host "Pass 2 Done."
