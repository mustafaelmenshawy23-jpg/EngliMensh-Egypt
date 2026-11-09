import { promises as fs } from 'node:fs';
import path from 'node:path';

const androidRoot = path.resolve('android');
const javaSource = `import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

@CapacitorPlugin(name = "Downloads")
public class DownloadsPlugin extends Plugin {
    @PluginMethod
    public void savePdf(PluginCall call) {
        String fileName = call.getString("fileName");
        String base64 = call.getString("base64");
        if (fileName == null || base64 == null || base64.isEmpty()) {
            call.reject("A PDF file name and base64 payload are required.");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Direct public Downloads export requires Android 10 or later.");
            return;
        }
        Uri itemUri = null;
        try {
            String safeName = fileName.replaceAll("[^A-Za-z0-9._-]", "_");
            if (!safeName.toLowerCase().endsWith(".pdf")) safeName += ".pdf";
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (bytes.length == 0 || bytes.length > 15 * 1024 * 1024) {
                call.reject("The PDF is empty or exceeds the 15 MB export limit.");
                return;
            }
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
            values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/EngliMensh");
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            itemUri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (itemUri == null) throw new IllegalStateException("Android did not create a Downloads entry.");
            try (OutputStream output = getContext().getContentResolver().openOutputStream(itemUri)) {
                if (output == null) throw new IllegalStateException("Could not open the Downloads file.");
                output.write(bytes);
                output.flush();
            }
            ContentValues published = new ContentValues();
            published.put(MediaStore.Downloads.IS_PENDING, 0);
            getContext().getContentResolver().update(itemUri, published, null, null);
            JSObject result = new JSObject();
            result.put("uri", itemUri.toString());
            result.put("displayName", safeName);
            result.put("folder", "Downloads/EngliMensh");
            call.resolve(result);
        } catch (Exception error) {
            if (itemUri != null) {
                try { getContext().getContentResolver().delete(itemUri, null, null); }
                catch (Exception ignored) { }
            }
            call.reject("Could not save the certificate in Downloads.", error);
        }
    }
}
`;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await walk(full);
      if (found) return found;
    } else if (entry.isFile() && entry.name === 'MainActivity.java') return full;
  }
  return null;
}

if (!(await fs.stat(androidRoot).catch(() => null))) {
  throw new Error('Android project is missing. Run this script immediately after "npx cap add android".');
}
const mainActivity = await walk(androidRoot);
if (!mainActivity) throw new Error('Generated MainActivity.java was not found; Android project layout is unsupported.');
const source = await fs.readFile(mainActivity, 'utf8');
const packageMatch = source.match(/^package\\s+([A-Za-z0-9_.]+);/m);
if (!packageMatch) throw new Error('Could not determine the generated Android package name.');
const packageName = packageMatch[1];
const pluginPath = path.join(path.dirname(mainActivity), 'DownloadsPlugin.java');
await fs.writeFile(pluginPath, 'package ' + packageName + ';\\n\\n' + javaSource, 'utf8');
const importLine = 'import ' + packageName + '.DownloadsPlugin;';
let updated = source;
if (!updated.includes(importLine)) updated = updated.replace(/(package\\s+[A-Za-z0-9_.]+;\\s*)/, '$1\\n' + importLine + '\\nimport android.os.Bundle;');
if (!updated.includes('registerPlugin(DownloadsPlugin.class)')) {
  updated = updated.replace(/public class MainActivity extends BridgeActivity\\s*\\{\\s*\\}/, 'public class MainActivity extends BridgeActivity {\\n    @Override\\n    public void onCreate(Bundle savedInstanceState) {\\n        registerPlugin(DownloadsPlugin.class);\\n        super.onCreate(savedInstanceState);\\n    }\\n}');
}
if (!updated.includes('registerPlugin(DownloadsPlugin.class)')) throw new Error('Could not safely register the Downloads plugin in MainActivity.');
await fs.writeFile(mainActivity, updated, 'utf8');
console.log('Registered native MediaStore Downloads export plugin at ' + pluginPath);
