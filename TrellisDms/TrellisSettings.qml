import QtQuick
import qs.Common
import qs.Modals.FileBrowser
import qs.Widgets
import qs.Modules.Plugins
import qs.Modules.Settings.Widgets
import "lib/trellisdiscovery.js" as TrellisDiscovery
import "lib/trellisprojection.js" as TrellisProjection
import "lib/trellisWatch.js" as TrellisWatch

PluginSettings {
    id: root

    pluginId: "trellisDms"

    property string instanceId: ""
    property var instanceData: null
    property var scanRoots: []
    property var rememberedProjects: []
    property bool usingLegacyRoot: false
    property string settingsWarning: ""
    property int refreshRequestSerial: 0
    readonly property int maxScanRoots: 16
    readonly property string desktopInstanceId: {
        var dataInstanceId = root.instanceData?.id;
        if (typeof dataInstanceId === "string" && dataInstanceId.length > 0)
            return dataInstanceId;
        return typeof root.instanceId === "string" ? root.instanceId : "";
    }
    readonly property bool isInstanceScopedPluginService: root.pluginService !== null
        && root.pluginService !== undefined
        && (typeof root.pluginService.loadPluginState !== "function"
            || typeof root.pluginService.savePluginState !== "function")
    readonly property bool isDesktopInstance: root.desktopInstanceId.length > 0
        || (root.instanceData !== null && root.instanceData !== undefined)
        || root.isInstanceScopedPluginService
    readonly property var pillModeSettingControl: globalSettingsLoader.item
        ? globalSettingsLoader.item.pillModeSettingControl : null

    function resetDesktopInstanceGeometry(resetPosition, resetSize) {
        if (!root.isDesktopInstance || !root.desktopInstanceId)
            return;

        var positionsByInstance = JSON.parse(JSON.stringify(
            SessionData.desktopWidgetInstancePositions || {}));
        var instancePositions = positionsByInstance[root.desktopInstanceId];
        if (!instancePositions)
            return;

        var screenKeys = Object.keys(instancePositions);
        for (var i = 0; i < screenKeys.length; i++) {
            var screenPosition = instancePositions[screenKeys[i]];
            if (!screenPosition || typeof screenPosition !== "object")
                continue;
            if (resetPosition) {
                delete screenPosition.x;
                delete screenPosition.y;
            }
            if (resetSize) {
                delete screenPosition.width;
                delete screenPosition.height;
            }
            if (Object.keys(screenPosition).length === 0)
                delete instancePositions[screenKeys[i]];
        }

        if (Object.keys(instancePositions).length === 0)
            delete positionsByInstance[root.desktopInstanceId];
        SessionData.set("desktopWidgetInstancePositions", positionsByInstance);
    }

    function loadVariants() {
        if (root.isDesktopInstance || !root.pluginService
                || typeof root.pluginService.getPluginVariants !== "function"
                || !root.pluginId) {
            root.variants = [];
        } else {
            root.variants = root.pluginService.getPluginVariants(root.pluginId);
        }
        root.syncVariantsToModel();
    }

    function localizedSettingsWarning(value) {
        switch (value) {
        case "Plugin settings are unavailable; the local choice was not saved.": return I18n.trFor("trellisDms", "Plugin settings are unavailable; the local choice was not saved.");
        case "Plugin settings could not save this choice; local controls remain usable.": return I18n.trFor("trellisDms", "Plugin settings could not save this choice; local controls remain usable.");
        case "Plugin settings are unavailable; safe defaults remain active.": return I18n.trFor("trellisDms", "Plugin settings are unavailable; safe defaults remain active.");
        case "Plugin settings could not be loaded; safe local defaults remain active.": return I18n.trFor("trellisDms", "Plugin settings could not be loaded; safe local defaults remain active.");
        case "Settings are unavailable or not writable; defaults could not be saved.": return I18n.trFor("trellisDms", "Settings are unavailable or not writable; defaults could not be saved.");
        case "Defaults were applied to settings, but DMS State is unavailable.": return I18n.trFor("trellisDms", "Defaults were applied to settings, but DMS State is unavailable.");
        case "Defaults changed locally, but DMS could not save every setting.": return I18n.trFor("trellisDms", "Defaults changed locally, but DMS could not save every setting.");
        case "Defaults restored. Trusted folders are empty until you add one again.": return I18n.trFor("trellisDms", "Defaults restored. Trusted folders are empty until you add one again.");
        case "Defaults changed locally, but DMS could not save every value.": return I18n.trFor("trellisDms", "Defaults changed locally, but DMS could not save every value.");
        case "DMS State is unavailable; remembered projects remain local only.": return I18n.trFor("trellisDms", "DMS State is unavailable; remembered projects remain local only.");
        case "DMS State could not be loaded; safe settings remain usable.": return I18n.trFor("trellisDms", "DMS State could not be loaded; safe settings remain usable.");
        case "Refresh is unavailable because plugin settings are not writable.": return I18n.trFor("trellisDms", "Refresh is unavailable because plugin settings are not writable.");
        case "Refresh requested; current data remains visible until the daemon publishes a new snapshot.": return I18n.trFor("trellisDms", "Refresh requested; current data remains visible until the daemon publishes a new snapshot.");
        case "Refresh could not be requested from DMS.": return I18n.trFor("trellisDms", "Refresh could not be requested from DMS.");
        default: return value;
        }
    }

    function savePluginSetting(key, value) {
        if (root.isDesktopInstance)
            return false;
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
        if (root.isDesktopInstance)
            return;
        var settingsView = root.globalSettingsLoader.item;
        if (!settingsView || !root.pillModeSettingControl)
            return;
        if (!root.pluginService
                || typeof root.pluginService.loadPluginData !== "function") {
            root.pillModeSettingControl.value = "auto";
            root.settingsWarning = "Plugin settings are unavailable; safe defaults remain active."
                .slice(0, 180);
            return;
        }
        try {
            settingsView.reloadChildValues();
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
            root.pillModeSettingControl.value = normalized;
            if (savedPillMode && previousWarning.indexOf("unavailable") === -1
                    && previousWarning.indexOf("could not") === -1)
                root.settingsWarning = "";
        } catch (error) {
            root.pillModeSettingControl.value = "auto";
            root.settingsWarning = "Plugin settings could not be loaded; safe local defaults remain active."
                .slice(0, 180);
        }
    }

    function restoreDefaults() {
        if (root.isDesktopInstance)
            return;
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
        if (root.isDesktopInstance)
            return;
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
        if (root.isDesktopInstance)
            return;
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
        if (root.isDesktopInstance)
            return;
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
        if (root.isDesktopInstance)
            return false;
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
        if (root.isDesktopInstance || !root.pluginService)
            return;
        root.loadDiscoveryData();
        root.loadUiSettings();
    })

    Connections {
        target: root

        function onPluginServiceChanged() {
            if (root.isDesktopInstance || !root.pluginService)
                return;
            Qt.callLater(root.loadDiscoveryData);
            Qt.callLater(root.loadUiSettings);
        }
    }

    Connections {
        target: root.pluginService
        enabled: !root.isDesktopInstance && root.pluginService !== null

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
            if (!root.isDesktopInstance && changedPluginId === root.pluginId) {
                root.loadDiscoveryData();
                root.loadUiSettings();
            }
        }
    }

    Loader {
        id: globalSettingsLoader

        active: !root.isDesktopInstance
        visible: !root.isDesktopInstance
        width: parent.width
        sourceComponent: Component {
            Column {
                id: globalSettingsView

                property var pillModeSettingControl: pillModeSetting

                width: parent.width
                spacing: Theme.spacingM

                function reloadChildValues() {
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (child !== pillModeSetting && child.loadValue)
                            child.loadValue();
                    }
                }

                function addFilesystemRootQuickAccess() {
                    var browser = trustedFolderPicker.content;
                    if (!browser)
                        return false;

                    var currentLocations = browser.quickAccessLocations;
                    if (!currentLocations || typeof currentLocations.length !== "number")
                        return false;

                    var locations = [];
                    for (var i = 0; i < currentLocations.length; i++) {
                        var location = currentLocations[i];
                        if (location && location.path === "/")
                            return true;
                        locations.push(location);
                    }
                    locations.unshift({
                        name: I18n.tr("Computer", "file browser quick access location"),
                        path: "/",
                        icon: "computer"
                    });
                    browser.quickAccessLocations = locations;
                    return true;
                }

                function scheduleFilesystemRootQuickAccess() {
                    Qt.callLater(function() {
                        globalSettingsView.addFilesystemRootQuickAccess();
                    });
                }

                FileBrowserModal {
                    id: trustedFolderPicker

                    browserTitle: I18n.trFor("trellisDms", "Select a trusted Trellis scan folder")
                    browserIcon: "folder_open"
                    browserType: "generic"
                    folderMode: true
                    showHiddenFiles: true
                    onContentChanged: {
                        if (visible)
                            globalSettingsView.scheduleFilesystemRootQuickAccess();
                    }
                    onVisibleChanged: {
                        if (visible)
                            globalSettingsView.scheduleFilesystemRootQuickAccess();
                    }
                    onFileSelected: path => {
                        root.addScanRoot(path);
                        trustedFolderPicker.close();
                    }
                }

                StyledText {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Trellis DMS v1.0")
                    font.pixelSize: Theme.fontSizeLarge
                    font.weight: Font.Bold
                    color: Theme.surfaceText
                }

                StyledText {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "The interface language follows DMS's active locale. Untranslated text uses the English source.")
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }

                SelectionSetting {
                    id: pillModeSetting

                    settingKey: "pillMode"
                    label: I18n.trFor("trellisDms", "Bar display mode")
                    description: I18n.trFor("trellisDms", "Automatic shows the only active task when there is exactly one; otherwise it uses compact counts. Vertical bars always use icons.")
                    options: [
                        { label: I18n.trFor("trellisDms", "Automatic (recommended)"), value: "auto" },
                        { label: I18n.trFor("trellisDms", "Active task"), value: "task" },
                        { label: I18n.trFor("trellisDms", "Project"), value: "project" },
                        { label: I18n.trFor("trellisDms", "Compact counts"), value: "counts" },
                        { label: I18n.trFor("trellisDms", "Icon only"), value: "icon" },
                        { label: I18n.trFor("trellisDms", "Full text"), value: "full" }
                    ]
                    // The empty initial value prevents this child from overwriting a
                    // legacy displayMode before loadUiSettings performs the migration.
                    defaultValue: ""
                }

                ToggleSetting {
                    settingKey: "showProgress"
                    label: I18n.trFor("trellisDms", "Show numeric progress")
                    description: I18n.trFor("trellisDms", "Show a progress line only when the live Snapshot contains a real numeric value; no value is fabricated.")
                    defaultValue: true
                }

                ToggleSetting {
                    settingKey: "showArchive"
                    label: I18n.trFor("trellisDms", "Show archive entry")
                    description: I18n.trFor("trellisDms", "Expose the historical archive browser separately from live tasks. Archive data stays read-only and lazy.")
                    defaultValue: true
                }

                ToggleSetting {
                    settingKey: "versionWarning"
                    label: I18n.trFor("trellisDms", "Show Trellis version warnings")
                    description: I18n.trFor("trellisDms", "Hide only compatibility warning presentation; the daemon keeps the version fact and diagnostics.")
                    defaultValue: true
                }

                StyledText {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Trusted scan folders")
                    font.pixelSize: Theme.fontSizeMedium
                    font.weight: Font.Medium
                    color: Theme.surfaceText
                }

                StyledText {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Choose up to 16 folders you trust. Trellis DMS normally searches inside these folders, up to 4 levels deep, for .trellis projects. If the selected folder is a project, .trellis, .trellis/tasks, or a live task folder, it checks at most 8 parent candidates and automatically promotes that selection to its containing Trellis project, so sibling and new direct tasks appear on the next configured topology refresh or after a manual refresh with Refresh Trellis data now. A completely new project outside these trusted folders still needs a one-time addition of a containing trusted folder; DMS does not infer the current Codex task or working directory globally. It never selects your entire home, mounted drives, /, or /proc automatically; a broad folder is scanned only if you explicitly add it. It never writes to Trellis project files. Successfully discovered projects are remembered in DMS state and revalidated on later rescans.")
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }

                StyledText {
                    visible: root.usingLegacyRoot
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Your existing Project or scan root is still active. Adding or removing a folder migrates this setting to the trusted-folder list.")
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
                                text: I18n.trFor("trellisDms", "Remove")
                                iconName: "remove_circle"
                                onClicked: root.removeScanRoot(index)
                            }
                        }
                    }

                    StyledText {
                        visible: root.scanRoots.length === 0
                        width: parent.width
                        text: I18n.trFor("trellisDms", "No trusted folders. Discovery is disabled.")
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                        wrapMode: Text.WordWrap
                    }

                    DankButton {
                        width: parent.width
                        text: I18n.trFor("trellisDms", "Add trusted folder")
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
                        text: I18n.trFor("trellisDms", "Remembered projects")
                        font.pixelSize: Theme.fontSizeMedium
                        font.weight: Font.Medium
                        color: Theme.surfaceText
                    }

                    StyledText {
                        width: parent.width
                        text: I18n.trFor("trellisDms", "This is a read-only cache from the last successful scan and never expands the trusted folders above. A selected task folder is automatically promoted to its containing project; sibling and new direct tasks appear after the next configured topology refresh or the manual Refresh Trellis data now action. A project outside trusted folders still requires a one-time trusted-folder addition, and DMS has no knowledge of Codex's current working directory.")
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
                        text: I18n.trFor("trellisDms", "%1 more remembered projects")
                            .arg(root.rememberedProjects.length - 8)
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                    }
                }

                SliderSetting {
                    settingKey: "topologyInterval"
                    label: I18n.trFor("trellisDms", "Topology rescan interval")
                    description: I18n.trFor("trellisDms", "How often new or moved Trellis files are discovered. The safe range is 15-300 seconds.")
                    defaultValue: TrellisWatch.topologyIntervalDefaults().defaultValue
                    minimum: TrellisWatch.topologyIntervalDefaults().minimum
                    maximum: TrellisWatch.topologyIntervalDefaults().maximum
                    unit: "s"
                    leftIcon: "sync"
                }

                DankButton {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Refresh Trellis data now")
                    iconName: "refresh"
                    onClicked: root.requestRefresh()
                }

                DankButton {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Restore defaults")
                    iconName: "restart_alt"
                    onClicked: root.restoreDefaults()
                }

                StyledText {
                    visible: root.settingsWarning !== ""
                    width: parent.width
                    text: root.localizedSettingsWarning(root.settingsWarning)
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.warning
                    wrapMode: Text.WordWrap
                }
            }
        }
    }

    Loader {
        id: desktopSettingsLoader

        active: root.isDesktopInstance
        visible: root.isDesktopInstance
        width: parent.width
        sourceComponent: Component {
            Column {
                width: parent.width
                spacing: Theme.spacingM

                StyledText {
                    visible: !root.desktopInstanceId
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Desktop widget instance ID is unavailable. Close and reopen these settings.")
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.warning
                    wrapMode: Text.WordWrap
                }

                SettingsDisplayPicker {
                    visible: root.desktopInstanceId.length > 0
                    displayPreferences: root.instanceData?.config?.displayPreferences ?? ["all"]
                    onPreferencesChanged: preferences => {
                        if (!root.desktopInstanceId)
                            return;
                        SettingsData.updateDesktopWidgetInstanceConfig(root.desktopInstanceId, {
                            displayPreferences: preferences
                        });
                    }
                }

                SettingsDivider {
                    visible: root.desktopInstanceId.length > 0
                }

                Item {
                    visible: root.desktopInstanceId.length > 0
                    width: parent.width
                    height: resetRow.height + Theme.spacingM * 2

                    Row {
                        id: resetRow
                        x: Theme.spacingM
                        anchors.verticalCenter: parent.verticalCenter
                        spacing: Theme.spacingM

                        DankButton {
                            text: I18n.tr("Reset Position")
                            backgroundColor: Theme.surfaceHover
                            textColor: Theme.surfaceText
                            buttonHeight: 36
                            onClicked: {
                                root.resetDesktopInstanceGeometry(true, false);
                            }
                        }

                        DankButton {
                            text: I18n.tr("Reset Size")
                            backgroundColor: Theme.surfaceHover
                            textColor: Theme.surfaceText
                            buttonHeight: 36
                            onClicked: {
                                root.resetDesktopInstanceGeometry(false, true);
                            }
                        }
                    }
                }
            }
        }
    }
}
