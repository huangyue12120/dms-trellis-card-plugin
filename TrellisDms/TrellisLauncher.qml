import QtQuick
import qs.Common
import qs.Services
import qs.Widgets
import qs.Modules.Plugins
import "lib/trellisprojection.js" as TrellisProjection

QtObject {
    id: root

    property var pluginService: null
    property string pluginId: "trellisDms"
    property string trigger: "!trellis"

    readonly property var snapshot: snapshotVar.value

    function getItems(query) {
        var projection = TrellisProjection.makeLauncherProjection(root.snapshot, query);
        var items = [];
        var projectedItems = projection.items || [];
        for (var i = 0; i < projectedItems.length; i++) {
            var item = projectedItems[i] || {};
            if (item.kind === "project") {
                root.appendResult(items, {
                    name: item.name,
                    icon: "material:folder_open",
                    comment: root.projectComment(item),
                    action: item.action,
                    categories: [I18n.trFor("trellisDms", "Trellis DMS")]
                });
            } else if (item.kind === "task") {
                root.appendResult(items, {
                    name: item.name,
                    icon: "material:task_alt",
                    comment: root.taskComment(item),
                    action: item.action,
                    categories: [I18n.trFor("trellisDms", "Trellis DMS")]
                });
            } else if (item.kind === "info") {
                root.appendResult(items, root.informationItem(item));
            } else if (item.kind === "overflow") {
                root.appendResult(items, {
                    name: I18n.trFor("trellisDms", "%1 more matches; refine your search")
                        .arg(item.hiddenCount).slice(0, 240),
                    icon: "material:more_horiz",
                    comment: "",
                    action: "",
                    categories: [I18n.trFor("trellisDms", "Trellis DMS")]
                });
            }
        }
        return items;
    }

    function appendResult(items, item) {
        item._preScored = 1000 - items.length;
        items.push(item);
    }

    function projectComment(item) {
        return I18n.trFor("trellisDms", "%1 active · %2 live tasks")
            .arg(item.activeTaskCount).arg(item.taskCount).slice(0, 240);
    }

    function taskComment(item) {
        var project = I18n.trFor("trellisDms", "Project: %1").arg(item.projectName);
        var state = root.localizedTaskState(item.state);
        if (item.activeSessionCount > 0) {
            var sessions = item.activeSessionCount === 1
                ? I18n.trFor("trellisDms", "%1 active session").arg(item.activeSessionCount)
                : I18n.trFor("trellisDms", "%1 active sessions").arg(item.activeSessionCount);
            return (project + " · " + state + " · " + sessions).slice(0, 240);
        }
        return (project + " · " + state).slice(0, 240);
    }

    function localizedTaskState(state) {
        switch (state) {
        case "active": return I18n.trFor("trellisDms", "Active");
        case "in_progress": return I18n.trFor("trellisDms", "In progress");
        case "planning": return I18n.trFor("trellisDms", "Planning");
        case "error": return I18n.trFor("trellisDms", "Error");
        default: return state;
        }
    }

    function informationItem(item) {
        var name = "";
        var comment = "";
        if (item.reason === "loading") {
            name = I18n.trFor("trellisDms", "Trellis status is loading");
            comment = I18n.trFor("trellisDms", "Open Trellis to review the latest status.");
        } else if (item.reason === "unconfigured") {
            name = I18n.trFor("trellisDms", "Set a trusted scan folder");
            comment = I18n.trFor("trellisDms", "Choose a project folder in Trellis settings.");
        } else {
            name = I18n.trFor("trellisDms", "No Trellis projects found");
            comment = I18n.trFor("trellisDms", "Check the configured trusted scan folders.");
        }
        return {
            name: name.slice(0, 240),
            icon: "material:account_tree",
            comment: comment.slice(0, 240),
            action: item.action,
            categories: [I18n.trFor("trellisDms", "Trellis DMS")]
        };
    }

    function executeItem(item) {
        var action = TrellisProjection.resolveLauncherAction(
            root.snapshot, item && item.action);
        if (!action)
            return;

        if (action.kind === "info") {
            root.requestPopout();
            return;
        }

        if (!root.pluginService
                || typeof root.pluginService.savePluginState !== "function")
            return;
        try {
            var savedProject = root.pluginService.savePluginState(
                root.pluginId, "selectedProjectId", action.projectId);
            if (savedProject === false)
                return;
            if (action.kind === "task") {
                var savedPin = root.pluginService.savePluginState(
                    root.pluginId, "pinnedTaskId", action.pinnedTaskId);
                if (savedPin === false)
                    return;
            }
        } catch (error) {
            return;
        }
        root.requestPopout();
    }

    function requestPopout() {
        if (typeof BarWidgetService === "undefined"
                || typeof BarWidgetService.triggerWidgetPopout !== "function")
            return false;
        try {
            return BarWidgetService.triggerWidgetPopout(root.pluginId) === true;
        } catch (error) {
            return false;
        }
    }

    PluginGlobalVar {
        id: snapshotVar
        varName: "snapshot"
        defaultValue: null
    }
}
