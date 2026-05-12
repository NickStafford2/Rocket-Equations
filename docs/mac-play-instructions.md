# Mac Instructions

1. Download `rocket-game-mac.zip`.
2. Double-click the zip file to unzip it.
3. Open the unzipped `dist` folder.
4. Right-click inside the folder and choose `New Terminal at Folder` if your Mac shows that option.
5. If not, open Terminal manually, type `cd `, then drag the `dist` folder into the Terminal window and press Enter.
6. Run:

```bash
python3 -m http.server 8000
```

7. Open a browser and go to:

```text
http://localhost:8000
```

8. When you are done, go back to Terminal and press `Control + C` to stop the server.

If `python3` is not installed, contact me and I will send fallback steps.
