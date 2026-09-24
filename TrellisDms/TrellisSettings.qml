import QtQuick
import qs.Common
import qs.Modals.FileBrowser
import qs.Widgets
import qs.Modules.Plugins
import "lib/trellisdiscovery.js" as TrellisDiscovery
import "lib/trellisprojection.js" as TrellisProjection
import "lib/trellisWatch.js" as TrellisWatch

PluginSettings {
    id: root

    pluginId: "trellisDms"

    property var scanRoots: []
    property var rememberedProjects: []
    property bool usingLegacyRoot: false
    property string settingsWarning: ""
    property int refreshRequestSerial: 0
    readonly property int maxScanRoots: 16

    function savePluginSetting(key, value) {
        if (!root.pluginService || !root.hasPermission
                || typeof root.pluginService.savePluginData !== "function") {
            root.settingsWarning = "Plugin settings are unavailable; the local choice was not saved."
                .slice(0, 180);
            return false;
        }
        try {
            root.pluginService.savePluginData(root.pluginId, key, value);
            root.settingChanged();
            return true;
        } catch (error) {
            root.settingsWarning = "Plugin settings could not save this choice; local controls remain usable."
                .slice(0, 180);
            return false;
        }
    }

    function loadUiSettings() {
        if (!root.pluginService
                || typeof root.pluginService.loadPluginData !== "function") {
            pillModeSetting.value = "auto";
            root.settingsWarning = "Plugin settings are unavailable; safe defaults remain active."
                .slice(0, 180);
            return;
        }
        try {
            var previousWarning = root.settingsWarning;
            var storedPillMode = root.loadValue("pillMode", null);
            var legacyDisplayMode = root.loadValue("displayMode", null);
            var source = storedPillMode !== null && storedPillMode !== undefined
                ? storedPillMode : legacyDisplayMode;
            var normalized = TrellisProjection.normalizeDisplayMode(source);
            var savedPillMode = true;
            if (storedPillMode === null || storedPillMode === undefined
                        || storedPillMode !== normalized)
                savedPillMode = root.savePluginSetting("pillMode", normalized);
            pillModeSetting.value = normalized;
            if (savedPillMode && previousWarning.indexOf("unavailable") === -1
                    && previousWarning.indexOf("could not") === -1)
                root.settingsWarning = "";
        } catch (error) {
            pillModeSetting.value = "auto";
            root.settingsWarning = "Plugin settings could not be loaded; safe local defaults remain active."
                .slice(0, 180);
        }
    }

    function restoreDefaults() {
        if (!root.pluginService || !root.pluginId || !root.hasPermission
                || typeof root.pluginService.savePluginData !== "function") {
            root.settingsWarning = "Settings are unavailable or not writable; defaults could not be saved."
                .slice(0, 180);
            return;
        }
        try {
            var settingsSaved = true;
            settingsSaved = root.savePluginSetting("pillMode", "auto") && settingsSaved;
            settingsSaved = root.savePluginSetting("showProgress", true) && settingsSaved;
            settingsSaved = root.savePluginSetting("showArchive", true) && settingsSaved;
            settingsSaved = root.savePluginSetting("versionWarning", true) && settingsSaved;
            settingsSaved = root.savePluginSetting("scanRoots", []) && settingsSaved;
            settingsSaved = root.savePluginSetting("topologyInterval",
                TrellisWatch.topologyIntervalDefaults().defaultValue) && settingsSaved;
            root.scanRoots = [];
            root.usingLegacyRoot = false;
            var stateKeys = ["pinnedTaskId", "selectedProjectId",
                "collapsedProjectIds", "collapsedTaskGroups", "selectedArchiveMonth"];
            var canLoadState = typeof root.pluginService.loadPluginState === "function";
            if (typeof root.pluginService.removePluginStateKey === "function"
                    && canLoadState) {
                // PluginService.removePluginStateKey is a no-op until its
                // per-plugin cache has been loaded. Prime it before removal.
                for (var loadIndex = 0; loadIndex < stateKeys.length; loadIndex++)
                    root.pluginService.loadPluginState(root.pluginId, stateKeys[loadIndex],
                        stateKeys[loadIndex] === "pinnedTaskId"
                            || stateKeys[loadIndex] === "selectedProjectId"
                            || stateKeys[loadIndex] === "selectedArchiveMonth" ? "" : []);
                for (var i = 0; i < stateKeys.length; i++)
                    root.pluginService.removePluginStateKey(root.pluginId, stateKeys[i]);
            } else if (typeof root.pluginService.savePluginState === "function") {
                for (var j = 0; j < stateKeys.length; j++)
                    root.pluginService.savePluginState(root.pluginId, stateKeys[j],
                        stateKeys[j] === "pinnedTaskId" || stateKeys[j] === "selectedProjectId"
                            || stateKeys[j] === "selectedArchiveMonth" ? "" : []);
            } else {
                root.settingsWarning = "Defaults were applied to settings, but DMS State is unavailable.";
                return;
            }
            if (!settingsSaved) {
                root.settingsWarning = "Defaults changed locally, but DMS could not save every setting."
                    .slice(0, 180);
            } else if (root.settingsWarning.indexOf("State") === -1) {
                root.settingsWarning = "Defaults restored. Trusted folders are empty until you add one again."
                    .slice(0, 180);
            }
        } catch (error) {
            root.settingsWarning = "Defaults changed locally, but DMS could not save every value."
                .slice(0, 180);
        }
    }

    function loadDiscoveryData() {
        if (!root.pluginService
                || typeof root.pluginService.loadPluginData !== "function") {
            root.settingsWarning = "Plugin settings are unavailable; safe local defaults remain active."
                .slice(0, 180);
            return;
        }

        var stateAvailable = typeof root.pluginService.loadPluginState === "function";
        try {
            var storedRoots = root.loadValue("scanRoots", null);
            if (Array.isArray(storedRoots)) {
                root.scanRoots = storedRoots.filter(function(path, index, values) {
                    return typeof path === "string" && path.trim().length > 0
                        && values.indexOf(path) === index;
                }).slice(0, root.maxScanRoots);
                root.usingLegacyRoot = false;
            } else {
                var legacyRoot = root.loadValue("projectRoot", "");
                root.scanRoots = typeof legacyRoot === "string" && legacyRoot.trim()
                    ? [legacyRoot.trim()] : [];
                root.usingLegacyRoot = root.scanRoots.length > 0;
            }

        } catch (error) {
            root.scanRoots = [];
            root.usingLegacyRoot = false;
            root.settingsWarning = "Plugin settings could not be loaded; safe local defaults remain active."
                .slice(0, 180);
            return;
        }

        if (!stateAvailable) {
            root.rememberedProjects = [];
            root.settingsWarning = "DMS State is unavailable; remembered projects remain local only."
                .slice(0, 180);
            return;
        }
        try {
            root.rememberedProjects = TrellisDiscovery.normalizeRememberedProjects(
                root.loadState("discoveredProjects", []), 32);
        } catch (error) {
            root.rememberedProjects = [];
            root.settingsWarning = "DMS State could not be loaded; safe settings remain usable."
                .slice(0, 180);
        }
    }

    function saveScanRoots(roots) {
        var unique = [];
        var values = Array.isArray(roots) ? roots : [];
        for (var i = 0; i < values.length; i++) {
            var value = typeof values[i] === "string" ? values[i].trim() : "";
            if (value && unique.indexOf(value) === -1)
                unique.push(value);
        }
        unique = unique.slice(0, root.maxScanRoots);
        root.scanRoots = unique;
        root.usingLegacyRoot = false;
        root.savePluginSetting("scanRoots", unique);
    }

    function addScanRoot(path) {
        var value = typeof path === "string" ? path.trim() : "";
        if (!value)
            return;
        root.saveScanRoots(root.scanRoots.concat([value]));
    }

    function removeScanRoot(index) {
        var next = root.scanRoots.slice();
        next.splice(index, 1);
        root.saveScanRoots(next);
    }

    function requestRefresh() {
        if (!root.pluginService || !root.hasPermission
                || typeof root.pluginService.savePluginData !== "function") {
            root.settingsWarning = "Refresh is unavailable because plugin settings are not writable."
                .slice(0, 180);
            return false;
        }
        try {
            root.refreshRequestSerial += 1;
            root.pluginService.savePluginData(root.pluginId, "refreshToken",
                Date.now() + "-" + root.refreshRequestSerial);
            root.settingsWarning = "Refresh requested; current data remains visible until the daemon publishes a new snapshot."
                .slice(0, 180);
            return true;
        } catch (error) {
            root.settingsWarning = "Refresh could not be requested from DMS."
                .slice(0, 180);
            return false;
        }
    }

    Component.onCompleted: Qt.callLater(function() {
        root.loadDiscoveryData();
        root.loadUiSettings();
    })

    Connections {
        target: root

        function onPluginServiceChanged() {
            Qt.callLater(root.loadDiscoveryData);
            Qt.callLater(root.loadUiSettings);
        }
    }

    Connections {
        target: root.pluginService
        enabled: root.pluginService !== null

        function onPluginStateChanged(changedPluginId) {
            if (changedPluginId !== root.pluginId)
                return;
            try {
                root.rememberedProjects = TrellisDiscovery.normalizeRememberedProjects(
                    root.loadState("discoveredProjects", []), 32);
            } catch (error) {
                root.rememberedProjects = [];
                root.settingsWarning = "DMS State could not be loaded; safe settings remain usable."
                    .slice(0, 180);
            }
        }

        function onPluginDataChanged(changedPluginId) {
            if (changedPluginId === root.pluginId) {
                root.loadDiscoveryData();
                root.loadUiSettings();
            }
        }
    }

    FileBrowserModal {
        id: trustedFolderPicker

        browserTitle: "Select a trusted Trellis scan folder"
        browserIcon: "folder_open"
        browserType: "generic"
        folderMode: true
        showHiddenFiles: true
        onFileSelected: path => {
            root.addScanRoot(path);
            trustedFolderPicker.close();
        }
    }

    StyledText {
        width: parent.width
        text: "Trellis DMS v0.7"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    SelectionSetting {
        id: pillModeSetting

        settingKey: "pillMode"
        label: "Bar display mode"
        description: "Automatic shows the only active task when there is exactly one; otherwise it uses compact counts. Vertical bars always use icons."
        options: [
            { label: "Automatic (recommended)", value: "auto" },
            { label: "Active task", value: "task" },
            { label: "Project", value: "project" },
            { label: "Compact counts", value: "counts" },
            { label: "Icon only", value: "icon" },
            { label: "Full text", value: "full" }
        ]
        // The empty initial value prevents this child from overwriting a
        // legacy displayMode before loadUiSettings performs the migration.
        defaultValue: ""
    }

    ToggleSetting {
        settingKey: "showProgress"
        label: "Show numeric progress"
        description: "Show a progress line only when the live Snapshot contains a real numeric value; no value is fabricated."
        defaultValue: true
    }

    ToggleSetting {
        settingKey: "showArchive"
        label: "Show archive entry"
        description: "Expose the historical archive browser separately from live tasks. Archive data stays read-only and lazy."
        defaultValue: true
    }

    ToggleSetting {
        settingKey: "versionWarning"
        label: "Show Trellis version warnings"
        description: "Hide only compatibility warning presentation; the daemon keeps the version fact and diagnostics."
        defaultValue: true
    }

    StyledText {
        width: parent.width
        text: "Trusted scan folders"
        font.pixelSize: Theme.fontSizeMedium
        font.weight: Font.Medium
        color: Theme.surfaceText
    }

    StyledText {
        width: parent.width
        text: "Choose up to 16 folders you trust. Trellis DMS normally searches inside these folders, up to 4 levels deep, for .trellis projects. If the selected folder is a project, .trellis, .trellis/tasks, or a live task folder, it checks at most 8 parent candidates and automatically promotes that selection to its containing Trellis project, so sibling and new direct tasks appear on the next configured topology refresh or after a manual refresh with Refresh Trellis data now. A completely new project outside these trusted folders still needs a one-time addition of a containing trusted folder; DMS does not infer the current Codex task or working directory globally. It never selects your entire home, mounted drives, /, or /proc automatically; a broad folder is scanned only if you explicitly add it. It never writes to Trellis project files. Successfully discovered projects are remembered in DMS state and revalidated on later rescans."
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.surfaceVariantText
        wrapMode: Text.WordWrap
    }

    StyledText {
        visible: root.usingLegacyRoot
        width: parent.width
        text: "Your existing Project or scan root is still active. Adding or removing a folder migrates this setting to the trusted-folder list."
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.warning
        wrapMode: Text.WordWrap
    }

    Column {
        width: parent.width
        spacing: Theme.spacingS

        Repeater {
            model: root.scanRoots

            StyledRect {
                required property int index
                required property string modelData

                width: parent.width
                height: 48
                radius: Theme.cornerRadius
                color: Theme.withAlpha(Theme.surfaceContainerHigh, Theme.popupTransparency)
                border.width: 0

                DankIcon {
                    id: rootFolderIcon

                    anchors.left: parent.left
                    anchors.leftMargin: Theme.spacingM
                    anchors.verticalCenter: parent.verticalCenter
                    name: "folder"
                    size: Theme.iconSize
                    color: Theme.surfaceVariantText
                }

                StyledText {
                    anchors.left: rootFolderIcon.right
                    anchors.leftMargin: Theme.spacingS
                    anchors.right: removeRootButton.left
                    anchors.rightMargin: Theme.spacingS
                    anchors.verticalCenter: parent.verticalCenter
                    text: modelData
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceText
                    wrapMode: Text.NoWrap
                    elide: Text.ElideMiddle
                }

                DankButton {
                    id: removeRootButton

                    anchors.right: parent.right
                    anchors.rightMargin: Theme.spacingS
                    anchors.verticalCenter: parent.verticalCenter
                    width: 88
                    height: 36
                    text: "Remove"
                    iconName: "remove_circle"
                    onClicked: root.removeScanRoot(index)
                }
            }
        }

        StyledText {
            visible: root.scanRoots.length === 0
            width: parent.width
            text: "No trusted folders. Discovery is disabled."
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.surfaceVariantText
            wrapMode: Text.WordWrap
        }

        DankButton {
            width: parent.width
            text: "Add trusted folder"
            iconName: "create_new_folder"
            enabled: root.scanRoots.length < root.maxScanRoots
            onClicked: trustedFolderPicker.open()
        }
    }

    Column {
        visible: root.rememberedProjects.length > 0
        width: parent.width
        spacing: Theme.spacingS

        StyledText {
            width: parent.width
            text: "Remembered projects"
            font.pixelSize: Theme.fontSizeMedium
            font.weight: Font.Medium
            color: Theme.surfaceText
        }

        StyledText {
            width: parent.width
            text: "This is a read-only cache from the last successful scan and never expands the trusted folders above. A selected task folder is automatically promoted to its containing project; sibling and new direct tasks appear after the next configured topology refresh or the manual Refresh Trellis data now action. A project outside trusted folders still requires a one-time trusted-folder addition, and DMS has no knowledge of Codex's current working directory."
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.surfaceVariantText
            wrapMode: Text.WordWrap
        }

        Repeater {
            model: root.rememberedProjects.slice(0, 8)

            StyledText {
                required property var modelData

                width: parent.width
                text: modelData.name + "\n" + modelData.root
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.surfaceVariantText
                wrapMode: Text.WrapAnywhere
            }
        }

        StyledText {
            visible: root.rememberedProjects.length > 8
            width: parent.width
            text: "+" + (root.rememberedProjects.length - 8) + " more remembered projects"
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.surfaceVariantText
        }
    }

    SliderSetting {
        settingKey: "topologyInterval"
        label: "Topology rescan interval"
        description: "How often new or moved Trellis files are discovered. The safe range is 15-300 seconds."
        defaultValue: TrellisWatch.topologyIntervalDefaults().defaultValue
        minimum: TrellisWatch.topologyIntervalDefaults().minimum
        maximum: TrellisWatch.topologyIntervalDefaults().maximum
        unit: "s"
        leftIcon: "sync"
    }

    DankButton {
        width: parent.width
        text: "Refresh Trellis data now"
        iconName: "refresh"
        onClicked: root.requestRefresh()
    }

    DankButton {
        width: parent.width
        text: "Restore defaults"
        iconName: "restart_alt"
        onClicked: root.restoreDefaults()
    }

    StyledText {
        visible: root.settingsWarning !== ""
        width: parent.width
        text: root.settingsWarning
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.warning
        wrapMode: Text.WordWrap
    }
}
