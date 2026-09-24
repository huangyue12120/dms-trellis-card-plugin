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
    property bool versionWarningPreference: true
    readonly property bool versionWarning: versionWarningPreference
    readonly property var projection: TrellisProjection.makeDesktopProjection(
        root.snapshot, { versionWarning: root.versionWarning })

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

    function sessionCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 session").arg(count)
            : I18n.trFor("trellisDms", "%1 sessions").arg(count)
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
                    text: I18n.trFor("trellisDms", "Trellis DMS")
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
                    text: root.projection.ready
                        ? root.projectCountLabel(root.projection.projectCount)
                        : ""
                    horizontalAlignment: Text.AlignRight
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    wrapMode: Text.NoWrap
                    elide: Text.ElideRight
                }
            }

            Column {
                id: warningSection

                visible: root.projection.ready && root.projection.warningCount > 0
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

            Repeater {
                model: root.projection.ready ? root.projection.projects : []

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
