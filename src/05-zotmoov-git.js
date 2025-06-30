Components.utils.importGlobalProperties(['PathUtils', 'IOUtils']);

var ZotMoovGit = class {
    constructor(zotmoov)
    {
        this._zotmoov = zotmoov;
        this._patcher = new ZotMoovPatcher();
        let self = this;
        for (const f of ['copy', 'move', 'delete']) {
            this._patcher.monkey_patch(
                ZotMoov.prototype, f, function (orig) {
                    return async function(...args)
                    {
                        const enabled = Zotero.Prefs.get(
                            'extensions.zotmoov.enable_git_commit', true
                        );
                        if (enabled) 
                            await self.executeScript("update");
                        const ret = await orig.apply(this, args);
                        if (enabled) 
                            await self.executeScript("commit");
                        return ret;
                    };
                }
            );
        }
    }

    destroy()
    {
        this._patcher.disable();
    }

    async executeScript(scriptName)
    {
        const repo_path = PathUtils.normalize(
            Zotero.Prefs.get('extensions.zotmoov.dst_dir', true)
        );
        if (typeof repo_path === 'undefined') 
            throw("Zotero.ZotMoovGit.executeScript: no dest dir is configured.");
        const script_path = PathUtils.join(
            repo_path, "script", `${scriptName}.sh`
        );
        await Zotero.Utilities.Internal.exec(
            "/bin/bash", ["-c", script_path]
        );
    }

}
