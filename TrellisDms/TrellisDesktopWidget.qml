import QtQuick
import qs.Common
import qs.Services
import qs.Widgets
import qs.Modules.Plugins
import "lib/trellisprojection.js" as TrellisProjection

DesktopPluginComponent {
    id: root

    minWidth: 180
    minHeight: 160

    readonly property var snapshot: snapshotVar.value
    readonly property var detailResponse: detailResponseVar.value
    readonly property string viewMode: TrellisProjection.normalizeDesktopViewMode(
        root.instanceConfig?.viewMode)
    property bool versionWarningPreference: true
    readonly property bool versionWarning: versionWarningPreference
    readonly property var projection: TrellisProjection.makeDesktopProjection(
        root.snapshot, { versionWarning: root.versionWarning }, root.detailResponse)

    Component.onCompleted: reloadVersionWarningPreference()
    onPluginIdChanged: reloadVersionWarningPreference()

    function reloadVersionWarningPreference() {
        versionWarningPreference = TrellisProjection.normalizeBooleanSetting(
            PluginService.loadPluginData(root.pluginId, "versionWarning", true), true)
    }

    function projectCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 project").arg(count)
            : I18n.trFor("trellisDms", "%1 projects").arg(count)
    }

    function warningCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 warning").arg(count)
            : I18n.trFor("trellisDms", "%1 warnings").arg(count)
    }

    function incidentCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 incident").arg(count)
            : I18n.trFor("trellisDms", "%1 incidents").arg(count)
    }

    function sessionCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 session").arg(count)
            : I18n.trFor("trellisDms", "%1 sessions").arg(count)
    }

    function taskCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 active task").arg(count)
            : I18n.trFor("trellisDms", "%1 active tasks").arg(count)
    }

    function viewModeLabel(value) {
        switch (value) {
        case "tasks": return I18n.trFor("trellisDms", "Tasks")
        case "health": return I18n.trFor("trellisDms", "Health")
        default: return I18n.trFor("trellisDms", "Overview")
        }
    }

    function healthSummaryLabel(health) {
        if (health.projectCount === 0)
            return I18n.trFor("trellisDms", "No project health data")
        var summary = health.attentionProjectCount === 1
            ? "%1 healthy · %2 needs attention"
            : "%1 healthy · %2 need attention"
        return I18n.trFor("trellisDms", summary)
            .arg(health.healthyProjectCount)
            .arg(health.attentionProjectCount)
    }

    function healthStatusLabel(status) {
        switch (status) {
        case "healthy": return I18n.trFor("trellisDms", "Healthy")
        case "warning": return I18n.trFor("trellisDms", "Needs attention")
        case "degraded": return I18n.trFor("trellisDms", "Degraded")
        default: return I18n.trFor("trellisDms", "Unknown")
        }
    }

    function localizedTaskState(state) {
        switch (state) {
        case "active": return I18n.trFor("trellisDms", "Active")
        case "in_progress": return I18n.trFor("trellisDms", "In progress")
        case "planning": return I18n.trFor("trellisDms", "Planning")
        case "error": return I18n.trFor("trellisDms", "Error")
        default: return state
        }
    }

    function localizedIncidentTitle(value) {
        var titles = {
            "Live task discovery failed": I18n.trFor("trellisDms", "Live task discovery failed"),
            "Session discovery failed": I18n.trFor("trellisDms", "Session discovery failed"),
            "Project discovery failed": I18n.trFor("trellisDms", "Project discovery failed"),
            "Live task data is incomplete": I18n.trFor("trellisDms", "Live task data is incomplete"),
            "Session data is incomplete": I18n.trFor("trellisDms", "Session data is incomplete"),
            "Trellis data could not be parsed": I18n.trFor("trellisDms", "Trellis data could not be parsed"),
            "Archive data is unavailable": I18n.trFor("trellisDms", "Archive data is unavailable"),
            "A discovery limit was reached": I18n.trFor("trellisDms", "A discovery limit was reached"),
            "A discovery or reload operation failed": I18n.trFor("trellisDms", "A discovery or reload operation failed"),
            "Trellis version could not be verified": I18n.trFor("trellisDms", "Trellis version could not be verified"),
            "Additional diagnostic": I18n.trFor("trellisDms", "Additional diagnostic")
        }
        return titles[value] || I18n.trFor("trellisDms", "Additional diagnostic")
    }

    function snapshotTimeLabel(value) {
        return value ? value : I18n.trFor("trellisDms", "Unavailable")
    }

    function localizedWarningMessage(value) {
        var message = typeof value === "string" ? value : ""
        var translations = {
            "Warning": I18n.trFor("trellisDms", "Warning"),
            "warning": I18n.trFor("trellisDms", "warning"),
            "could not create discovery process": I18n.trFor("trellisDms", "could not create discovery process"),
            "could not create file reader": I18n.trFor("trellisDms", "could not create file reader"),
            "project discovery cap reached": I18n.trFor("trellisDms", "project discovery cap reached"),
            "could not read .trellis/.version": I18n.trFor("trellisDms", "could not read .trellis/.version"),
            "version path rejected": I18n.trFor("trellisDms", "version path rejected"),
            "Trellis version is not the verified compatibility baseline": I18n.trFor("trellisDms", "Trellis version is not the verified compatibility baseline"),
            "Trellis version is missing or malformed": I18n.trFor("trellisDms", "Trellis version is missing or malformed"),
            "archive directory is unavailable; archive tasks are not loaded": I18n.trFor("trellisDms", "archive directory is unavailable; archive tasks are not loaded"),
            "archive directory path rejected": I18n.trFor("trellisDms", "archive directory path rejected"),
            "could not discover live task directories": I18n.trFor("trellisDms", "could not discover live task directories"),
            "could not discover session pointers": I18n.trFor("trellisDms", "could not discover session pointers"),
            "task directory could not be canonicalized": I18n.trFor("trellisDms", "task directory could not be canonicalized"),
            "task directory rejected": I18n.trFor("trellisDms", "task directory rejected"),
            "task.json could not be canonicalized": I18n.trFor("trellisDms", "task.json could not be canonicalized"),
            "task.json path rejected": I18n.trFor("trellisDms", "task.json path rejected"),
            "session pointer could not be canonicalized": I18n.trFor("trellisDms", "session pointer could not be canonicalized"),
            "session file rejected": I18n.trFor("trellisDms", "session file rejected"),
            "canonical root escaped its configured root": I18n.trFor("trellisDms", "canonical root escaped its configured root"),
            "could not discover .trellis directories": I18n.trFor("trellisDms", "could not discover .trellis directories"),
            "discovered .trellis path could not be canonicalized": I18n.trFor("trellisDms", "discovered .trellis path could not be canonicalized"),
            "discovered project is outside configured root": I18n.trFor("trellisDms", "discovered project is outside configured root"),
            "known-file reload queue cap reached": I18n.trFor("trellisDms", "known-file reload queue cap reached"),
            "known-file project is no longer loaded": I18n.trFor("trellisDms", "known-file project is no longer loaded"),
            "could not reload .trellis/.version": I18n.trFor("trellisDms", "could not reload .trellis/.version"),
            "task.json reload failed; last valid value retained": I18n.trFor("trellisDms", "task.json reload failed; last valid value retained"),
            "task.json is malformed; last valid value retained": I18n.trFor("trellisDms", "task.json is malformed; last valid value retained"),
            "session pointer reload failed; last valid value retained": I18n.trFor("trellisDms", "session pointer reload failed; last valid value retained"),
            "session pointer is malformed; last valid value retained": I18n.trFor("trellisDms", "session pointer is malformed; last valid value retained"),
            "known-file watcher cap reached": I18n.trFor("trellisDms", "known-file watcher cap reached"),
            "could not create known-file watcher": I18n.trFor("trellisDms", "could not create known-file watcher"),
            "no Trellis project was found under the configured root": I18n.trFor("trellisDms", "no Trellis project was found under the configured root"),
            "discovery was degraded; last valid Trellis snapshot retained": I18n.trFor("trellisDms", "discovery was degraded; last valid Trellis snapshot retained"),
            "trusted scan root cap reached": I18n.trFor("trellisDms", "trusted scan root cap reached"),
            "topology interval was normalized to the safe 15–300 second range": I18n.trFor("trellisDms", "topology interval was normalized to the safe 15–300 second range"),
            "configured root could not be canonicalized": I18n.trFor("trellisDms", "configured root could not be canonicalized"),
            "no project root is configured": I18n.trFor("trellisDms", "no project root is configured"),
            "duplicate project root ignored": I18n.trFor("trellisDms", "duplicate project root ignored"),
            "discovery output exceeded its byte limit": I18n.trFor("trellisDms", "discovery output exceeded its byte limit"),
            "discovery line contains a control character": I18n.trFor("trellisDms", "discovery line contains a control character"),
            "discovery result cap reached": I18n.trFor("trellisDms", "discovery result cap reached"),
            "parent/child relation conflict": I18n.trFor("trellisDms", "parent/child relation conflict"),
            "session JSON must contain an object": I18n.trFor("trellisDms", "session JSON must contain an object"),
            "session current_task is not a non-empty string": I18n.trFor("trellisDms", "session current_task is not a non-empty string"),
            "session pointer does not resolve to a task": I18n.trFor("trellisDms", "session pointer does not resolve to a task"),
            "session pointer resolved outside loaded task records": I18n.trFor("trellisDms", "session pointer resolved outside loaded task records")
        }
        var parentPrefix = "unknown parent relation: "
        if (message.indexOf(parentPrefix) === 0)
            return I18n.trFor("trellisDms", "Unknown %1 relation: %2")
                .arg(I18n.trFor("trellisDms", "parent"))
                .arg(message.slice(parentPrefix.length))
        var childPrefix = "unknown child relation: "
        if (message.indexOf(childPrefix) === 0)
            return I18n.trFor("trellisDms", "Unknown %1 relation: %2")
                .arg(I18n.trFor("trellisDms", "child"))
                .arg(message.slice(childPrefix.length))
        var rootPrefix = "project root rejected: "
        if (message.indexOf(rootPrefix) === 0)
            return I18n.trFor("trellisDms", "Project root rejected: %1")
                .arg(message.slice(rootPrefix.length))
        return translations[message] || message
    }

    Connections {
        target: PluginService

        function onPluginDataChanged(changedPluginId) {
            if (changedPluginId === root.pluginId)
                root.reloadVersionWarningPreference()
        }
    }

    PluginGlobalVar {
        id: snapshotVar
        varName: "snapshot"
        defaultValue: null
    }

    PluginGlobalVar {
        id: detailResponseVar
        varName: "detailResponse"
        defaultValue: null
    }

    Rectangle {
        id: background

        anchors.fill: parent
        radius: Theme.cornerRadius
        color: Theme.surfaceContainer
        clip: true
    }

    DankFlickable {
        id: contentScroll

        anchors.fill: background
        anchors.margins: Theme.spacingM
        contentWidth: width
        contentHeight: contentColumn.implicitHeight
        clip: true

        Column {
            id: contentColumn

            width: contentScroll.width
            spacing: Theme.spacingS

            Item {
                id: header

                width: parent.width
                height: Math.max(headerIcon.implicitHeight,
                    headerTitle.implicitHeight, projectCount.implicitHeight)

                DankIcon {
                    id: headerIcon

                    anchors.left: parent.left
                    anchors.verticalCenter: parent.verticalCenter
                    name: "account_tree"
                    size: Theme.iconSize
                    color: Theme.primary
                }

                StyledText {
                    id: headerTitle

                    anchors.left: headerIcon.right
                    anchors.leftMargin: Theme.spacingXS
                    anchors.right: projectCount.left
                    anchors.rightMargin: Theme.spacingXS
                    anchors.verticalCenter: parent.verticalCenter
                    text: root.viewMode === "overview"
                        ? I18n.trFor("trellisDms", "Trellis DMS")
                        : I18n.trFor("trellisDms", "%1 · %2")
                            .arg(I18n.trFor("trellisDms", "Trellis DMS"))
                            .arg(root.viewModeLabel(root.viewMode))
                    font.pixelSize: Theme.fontSizeMedium
                    font.weight: Font.DemiBold
                    color: Theme.surfaceText
                    wrapMode: Text.NoWrap
                    elide: Text.ElideRight
                }

                StyledText {
                    id: projectCount

                    anchors.right: parent.right
                    anchors.verticalCenter: parent.verticalCenter
                    width: Math.min(90, parent.width * 0.55)
                    text: {
                        if (!root.projection.ready)
                            return "";
                        if (root.viewMode === "tasks")
                            return root.taskCountLabel(root.projection.activeTaskCount);
                        if (root.viewMode === "health")
                            return root.incidentCountLabel(root.projection.health.incidentCount);
                        return root.projectCountLabel(root.projection.projectCount);
                    }
                    horizontalAlignment: Text.AlignRight
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.NoWrap
                    elide: Text.ElideRight
                }
            }

            Column {
                id: warningSection

                visible: root.viewMode === "overview"
                    && root.projection.ready && root.projection.warningCount > 0
                width: parent.width
                spacing: Theme.spacingXS

                Row {
                    spacing: Theme.spacingXS

                    DankIcon {
                        anchors.verticalCenter: parent.verticalCenter
                        name: "warning"
                        size: Theme.iconSize - 4
                        color: Theme.warning
                    }

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: root.warningCountLabel(root.projection.warningCount)
                        font.pixelSize: Theme.fontSizeSmall
                        font.weight: Font.DemiBold
                        color: Theme.warning
                    }
                }

                Repeater {
                    model: root.projection.warnings

                    Item {
                        required property var modelData

                        width: warningSection.width
                        height: Math.max(warningIcon.implicitHeight,
                            warningMessage.implicitHeight)

                        DankIcon {
                            id: warningIcon

                            anchors.left: parent.left
                            anchors.top: parent.top
                            name: "warning"
                            size: Theme.iconSize - 6
                            color: Theme.warning
                        }

                        StyledText {
                            id: warningMessage

                            anchors.left: warningIcon.right
                            anchors.leftMargin: Theme.spacingXS
                            anchors.right: parent.right
                            text: modelData.code + ": "
                                + root.localizedWarningMessage(modelData.message)
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }
                    }
                }

                StyledText {
                    visible: root.projection.hiddenWarningCount > 0
                    width: parent.width
                    text: I18n.trFor("trellisDms", "%1 more warnings · see the bar popout")
                        .arg(root.projection.hiddenWarningCount)
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }
            }

            StyledText {
                visible: !root.projection.ready
                width: parent.width
                text: I18n.trFor("trellisDms", "Loading Trellis status...")
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceVariantText
                wrapMode: Text.WordWrap
            }

            StyledText {
                visible: root.projection.ready
                    && root.projection.projectCount === 0
                    && root.projection.unconfigured
                width: parent.width
                text: I18n.trFor("trellisDms", "Add a trusted scan folder in Trellis DMS Settings.")
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceVariantText
                wrapMode: Text.WordWrap
            }

            StyledText {
                visible: root.projection.ready
                    && root.projection.projectCount === 0
                    && !root.projection.unconfigured
                width: parent.width
                text: I18n.trFor("trellisDms", "No Trellis projects were found under the trusted scan folders.")
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceVariantText
                wrapMode: Text.WordWrap
            }

            StyledText {
                visible: root.viewMode === "overview" && root.projection.ready
                width: parent.width
                text: root.healthSummaryLabel(root.projection.health)
                font.pixelSize: Theme.fontSizeSmall
                color: root.projection.health.attentionProjectCount > 0
                    ? Theme.warning : Theme.surfaceVariantText
                wrapMode: Text.WordWrap
            }

            Column {
                id: tasksContent

                visible: root.viewMode === "tasks" && root.projection.ready
                width: parent.width
                spacing: Theme.spacingS

                StyledText {
                    visible: root.projection.health.taskDataDegraded
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Some Trellis data needs attention; task details may be incomplete.")
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.warning
                    wrapMode: Text.WordWrap
                }

                StyledText {
                    visible: root.projection.activeTaskCount === 0
                    width: parent.width
                    text: I18n.trFor("trellisDms", "No active tasks")
                    font.pixelSize: Theme.fontSizeMedium
                    color: Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }

                Repeater {
                    model: root.projection.taskProjects

                    Column {
                        id: taskProjectSection

                        required property var modelData

                        width: tasksContent.width
                        spacing: Theme.spacingXS

                        StyledText {
                            width: parent.width
                            text: taskProjectSection.modelData.name
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.DemiBold
                            color: Theme.surfaceText
                            wrapMode: Text.NoWrap
                            elide: Text.ElideRight
                        }

                        Repeater {
                            model: taskProjectSection.modelData.activeTasks

                            Column {
                                required property var modelData

                                width: taskProjectSection.width
                                spacing: Theme.spacingXXS

                                StyledText {
                                    width: parent.width
                                    leftPadding: Theme.spacingM
                                    text: modelData.title
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.surfaceText
                                    wrapMode: Text.WordWrap
                                }

                                StyledText {
                                    width: parent.width
                                    leftPadding: Theme.spacingM
                                    text: I18n.trFor("trellisDms", "%1 · %2 · %3")
                                        .arg(root.localizedTaskState(modelData.displayState))
                                        .arg(modelData.priority)
                                        .arg(root.sessionCountLabel(modelData.activeSessionCount))
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.surfaceVariantText
                                    wrapMode: Text.WordWrap
                                }
                            }
                        }
                    }
                }
            }

            Column {
                id: healthContent

                visible: root.viewMode === "health" && root.projection.ready
                width: parent.width
                spacing: Theme.spacingS

                StyledText {
                    width: parent.width
                    text: root.healthSummaryLabel(root.projection.health)
                    font.pixelSize: Theme.fontSizeSmall
                    font.weight: Font.Medium
                    color: root.projection.health.attentionProjectCount > 0
                        ? Theme.warning : Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }

                StyledText {
                    visible: root.projection.health.fallbackActive
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Showing the last valid snapshot")
                    font.pixelSize: Theme.fontSizeSmall
                    font.weight: Font.DemiBold
                    color: Theme.warning
                    wrapMode: Text.WordWrap
                }

                StyledText {
                    width: parent.width
                    text: I18n.trFor("trellisDms", "Last successful scan: %1")
                        .arg(root.snapshotTimeLabel(
                            root.projection.health.freshness.lastSuccessfulDiscoveryAt))
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }

                StyledText {
                    visible: root.projection.projectCount > 0
                        && root.projection.health.incidentCount === 0
                    width: parent.width
                    text: I18n.trFor("trellisDms", "All loaded projects are healthy")
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.WordWrap
                }

                Repeater {
                    model: root.projection.health.projects

                    Column {
                        id: healthProjectSection

                        required property var modelData

                        width: healthContent.width
                        spacing: Theme.spacingXS

                        StyledText {
                            width: parent.width
                            text: healthProjectSection.modelData.name + " · "
                                + root.healthStatusLabel(healthProjectSection.modelData.status)
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.DemiBold
                            color: healthProjectSection.modelData.status === "healthy"
                                ? Theme.surfaceText : Theme.warning
                            wrapMode: Text.WordWrap
                        }

                        Repeater {
                            model: healthProjectSection.modelData.incidents

                            StyledText {
                                required property var modelData

                                width: healthProjectSection.width
                                leftPadding: Theme.spacingM
                                text: root.localizedIncidentTitle(modelData.title)
                                    + " · " + modelData.count
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                                wrapMode: Text.WordWrap
                            }
                        }
                    }
                }

                Column {
                    visible: root.projection.health.unscopedIncidents.length > 0
                    width: parent.width
                    spacing: Theme.spacingXS

                    StyledText {
                        width: parent.width
                        text: I18n.trFor("trellisDms", "Overall diagnostics")
                        font.pixelSize: Theme.fontSizeMedium
                        font.weight: Font.DemiBold
                        color: Theme.surfaceText
                        wrapMode: Text.WordWrap
                    }

                    Repeater {
                        model: root.projection.health.unscopedIncidents

                        StyledText {
                            required property var modelData

                            width: parent.width
                            leftPadding: Theme.spacingM
                            text: root.localizedIncidentTitle(modelData.title)
                                + " · " + modelData.count
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }
                    }
                }
            }

            Repeater {
                model: root.viewMode === "overview" && root.projection.ready
                    ? root.projection.projects : []

                Column {
                    id: projectSection

                    required property var modelData

                    width: contentColumn.width
                    spacing: Theme.spacingXS

                    Item {
                        width: parent.width
                        height: Math.max(projectName.implicitHeight,
                            projectCounts.implicitHeight)

                        StyledText {
                            id: projectName

                            anchors.left: parent.left
                            anchors.right: projectCounts.left
                            anchors.rightMargin: Theme.spacingXS
                            anchors.verticalCenter: parent.verticalCenter
                            text: projectSection.modelData.name
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.DemiBold
                            color: Theme.surfaceText
                            wrapMode: Text.NoWrap
                            elide: Text.ElideRight
                        }

                        StyledText {
                            id: projectCounts

                            anchors.right: parent.right
                            anchors.verticalCenter: parent.verticalCenter
                            width: Math.min(100, parent.width * 0.6)
                            text: I18n.trFor("trellisDms", "%1 active · %2 live")
                                .arg(projectSection.modelData.activeTaskCount)
                                .arg(projectSection.modelData.taskCount)
                            horizontalAlignment: Text.AlignRight
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.NoWrap
                            elide: Text.ElideRight
                        }
                    }

                    StyledText {
                        visible: projectSection.modelData.activeTasks.length === 0
                        width: parent.width
                        leftPadding: Theme.spacingM
                        text: I18n.trFor("trellisDms", "No active session-backed tasks")
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                        wrapMode: Text.WordWrap
                    }

                    Repeater {
                        model: projectSection.modelData.activeTasks

                        Item {
                            required property var modelData

                            width: projectSection.width
                            height: Math.max(taskIcon.implicitHeight,
                                taskDetails.implicitHeight + Theme.spacingXS * 2)

                            DankIcon {
                                id: taskIcon

                                anchors.left: parent.left
                                anchors.leftMargin: Theme.spacingM
                                anchors.top: parent.top
                                name: "play_circle"
                                size: Theme.iconSize - 4
                                color: Theme.primary
                            }

                            Column {
                                id: taskDetails

                                anchors.left: taskIcon.right
                                anchors.leftMargin: Theme.spacingXS
                                anchors.right: parent.right
                                spacing: Theme.spacingXXS

                                StyledText {
                                    width: parent.width
                                    text: modelData.title
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.surfaceText
                                    wrapMode: Text.NoWrap
                                    elide: Text.ElideRight
                                }

                                StyledText {
                                    width: parent.width
                                    text: I18n.trFor("trellisDms", "Active · %1")
                                        .arg(root.sessionCountLabel(modelData.activeSessionCount))
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.surfaceVariantText
                                    wrapMode: Text.NoWrap
                                    elide: Text.ElideRight
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
