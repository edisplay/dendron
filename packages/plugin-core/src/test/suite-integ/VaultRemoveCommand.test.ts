import { DendronConfig } from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import assert from "assert";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { VaultRemoveCommand } from "../../commands/VaultRemoveCommand";
import { WorkspaceSettings } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("VaultRemoveCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    runMultiVaultTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        // @ts-ignore
        VSCodeUtils.showQuickPick = () => {
          return { data: vaults[1] };
        };
        await new VaultRemoveCommand().run();

        // check no files deleted
        assert.deepStrictEqual(
          fs.readdirSync(path.join(wsRoot, vaults[1].fsPath)),
          [
            "bar.ch1.md",
            "bar.md",
            "bar.schema.yml",
            "root.md",
            "root.schema.yml",
          ]
        );

        // check config updated
        const configPath = DConfig.configPath(
          DendronWorkspace.wsRoot() as string
        );
        const config = readYAML(configPath) as DendronConfig;
        assert.deepStrictEqual(
          config.vaults.map((ent) => ent.fsPath),
          [vaults[0].fsPath]
        );

        // check vscode settings updated
        const settings = fs.readJSONSync(
          DendronWorkspace.workspaceFile().fsPath
        ) as WorkspaceSettings;
        assert.deepStrictEqual(settings.folders, [{ path: vaults[0].fsPath }]);
        done();
      },
    });
  });
});
