#include "MainWindow.h"

#include <QAbstractItemView>
#include <QDir>
#include <QDirIterator>
#include <QFileDialog>
#include <QFileInfo>
#include <QFrame>
#include <QHeaderView>
#include <QHBoxLayout>
#include <QIcon>
#include <QLabel>
#include <QLineEdit>
#include <QMessageBox>
#include <QPluginLoader>
#include <QPushButton>
#include <QStandardPaths>
#include <QTableWidget>
#include <QTableWidgetItem>
#include <QVBoxLayout>
#include <QWidget>

#include <algorithm>

namespace {
const QStringList kGameExtensions = {
    "nes", "fds", "unf", "unif",
    "gb", "gbc", "gba", "nds", "3ds", "cia",
    "sms", "gg", "md", "gen", "32x", "bin",
    "sfc", "smc", "n64", "z64", "v64",
    "iso", "cso", "chd", "cue", "gcm", "rvz", "wbfs", "wud", "wux", "pbp",
    "zip"
};

QString displayFileName(const QString &path)
{
    return QFileInfo(path).completeBaseName();
}
}

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent),
      m_settings(QStringLiteral("NVDEMU"), QStringLiteral("nvd-emu"))
{
    setWindowTitle(QStringLiteral("nvd-emu"));
    setMinimumSize(940, 620);
    resize(1280, 800);

    buildUi();
    applyTheme();
    loadSettings();
    reloadCores();
    scanSavedFolders();
    refreshLibrary();
}

void MainWindow::buildUi()
{
    auto *central = new QWidget(this);
    auto *root = new QHBoxLayout(central);
    root->setContentsMargins(18, 18, 18, 18);
    root->setSpacing(18);

    auto *sidebar = new QFrame(central);
    sidebar->setObjectName(QStringLiteral("Sidebar"));
    sidebar->setFixedWidth(214);
    auto *sideLayout = new QVBoxLayout(sidebar);
    sideLayout->setContentsMargins(16, 18, 16, 16);
    sideLayout->setSpacing(12);

    auto *brandRow = new QHBoxLayout;
    auto *brandIcon = new QLabel(sidebar);
    brandIcon->setFixedSize(44, 44);
    brandIcon->setPixmap(QIcon(QStringLiteral(":/brand/nvd-emu-logo.svg")).pixmap(44, 44));
    brandIcon->setScaledContents(true);
    auto *brandText = new QVBoxLayout;
    auto *brandName = new QLabel(QStringLiteral("nvd-emu"), sidebar);
    brandName->setObjectName(QStringLiteral("BrandName"));
    auto *brandSubtitle = new QLabel(QStringLiteral("MULTI-SYSTEM EMULATOR"), sidebar);
    brandSubtitle->setObjectName(QStringLiteral("Eyebrow"));
    brandText->addWidget(brandName);
    brandText->addWidget(brandSubtitle);
    brandRow->addWidget(brandIcon);
    brandRow->addLayout(brandText, 1);
    sideLayout->addLayout(brandRow);
    sideLayout->addSpacing(24);

    auto *navHeading = new QLabel(QStringLiteral("WORKSPACE"), sidebar);
    navHeading->setObjectName(QStringLiteral("Eyebrow"));
    sideLayout->addWidget(navHeading);

    auto *libraryButton = new QPushButton(QStringLiteral("  Game library"), sidebar);
    libraryButton->setObjectName(QStringLiteral("NavActive"));
    libraryButton->setMinimumHeight(42);
    libraryButton->setCursor(Qt::PointingHandCursor);
    sideLayout->addWidget(libraryButton);

    auto *coresButton = new QPushButton(QStringLiteral("  System cores"), sidebar);
    coresButton->setObjectName(QStringLiteral("NavButton"));
    coresButton->setMinimumHeight(42);
    coresButton->setCursor(Qt::PointingHandCursor);
    sideLayout->addWidget(coresButton);

    auto *aboutButton = new QPushButton(QStringLiteral("  About nvd-emu"), sidebar);
    aboutButton->setObjectName(QStringLiteral("NavButton"));
    aboutButton->setMinimumHeight(42);
    aboutButton->setCursor(Qt::PointingHandCursor);
    sideLayout->addWidget(aboutButton);
    sideLayout->addStretch();

    auto *sidebarNote = new QLabel(
        QStringLiteral("EARLY DEVELOPMENT\nFrontend and core interface first.\nSystem compatibility comes later."),
        sidebar);
    sidebarNote->setObjectName(QStringLiteral("SidebarNote"));
    sidebarNote->setWordWrap(true);
    sideLayout->addWidget(sidebarNote);

    auto *mainPanel = new QWidget(central);
    auto *mainLayout = new QVBoxLayout(mainPanel);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(16);

    auto *headingRow = new QHBoxLayout;
    auto *headingStack = new QVBoxLayout;
    auto *pageHeading = new QLabel(QStringLiteral("Game library"), mainPanel);
    pageHeading->setObjectName(QStringLiteral("PageHeading"));
    auto *pageSubtitle = new QLabel(
        QStringLiteral("Your collection, in one place. Add files or scan a games folder to begin."),
        mainPanel);
    pageSubtitle->setObjectName(QStringLiteral("Muted"));
    pageSubtitle->setWordWrap(true);
    headingStack->addWidget(pageHeading);
    headingStack->addWidget(pageSubtitle);
    headingRow->addLayout(headingStack, 1);
    mainLayout->addLayout(headingRow);

    auto *metricsRow = new QHBoxLayout;
    metricsRow->setSpacing(12);
    const auto makeMetricCard = [mainPanel](const QString &caption, QLabel **valueOut) {
        auto *card = new QFrame(mainPanel);
        card->setObjectName(QStringLiteral("MetricCard"));
        auto *layout = new QVBoxLayout(card);
        layout->setContentsMargins(16, 12, 16, 12);
        layout->setSpacing(4);
        auto *captionLabel = new QLabel(caption, card);
        captionLabel->setObjectName(QStringLiteral("Muted"));
        auto *valueLabel = new QLabel(QStringLiteral("0"), card);
        valueLabel->setObjectName(QStringLiteral("MetricValue"));
        layout->addWidget(captionLabel);
        layout->addWidget(valueLabel);
        *valueOut = valueLabel;
        return card;
    };
    metricsRow->addWidget(makeMetricCard(QStringLiteral("GAMES IN LIBRARY"), &m_libraryCount), 1);
    metricsRow->addWidget(makeMetricCard(QStringLiteral("CORES DISCOVERED"), &m_coreCount), 1);
    mainLayout->addLayout(metricsRow);

    auto *toolbar = new QHBoxLayout;
    toolbar->setSpacing(10);
    m_searchBox = new QLineEdit(mainPanel);
    m_searchBox->setObjectName(QStringLiteral("SearchBox"));
    m_searchBox->setPlaceholderText(QStringLiteral("Search titles, systems, or file paths…"));
    m_searchBox->setClearButtonEnabled(true);
    m_searchBox->setMinimumHeight(40);
    toolbar->addWidget(m_searchBox, 1);

    auto *addFilesButton = new QPushButton(QStringLiteral("Add game files"), mainPanel);
    addFilesButton->setObjectName(QStringLiteral("PrimaryButton"));
    addFilesButton->setMinimumHeight(40);
    addFilesButton->setCursor(Qt::PointingHandCursor);
    toolbar->addWidget(addFilesButton);

    auto *scanButton = new QPushButton(QStringLiteral("Scan folder"), mainPanel);
    scanButton->setObjectName(QStringLiteral("SecondaryButton"));
    scanButton->setMinimumHeight(40);
    scanButton->setCursor(Qt::PointingHandCursor);
    toolbar->addWidget(scanButton);

    auto *removeButton = new QPushButton(QStringLiteral("Remove"), mainPanel);
    removeButton->setObjectName(QStringLiteral("SecondaryButton"));
    removeButton->setMinimumHeight(40);
    removeButton->setCursor(Qt::PointingHandCursor);
    toolbar->addWidget(removeButton);
    mainLayout->addLayout(toolbar);

    m_gameTable = new QTableWidget(mainPanel);
    m_gameTable->setObjectName(QStringLiteral("GameTable"));
    m_gameTable->setColumnCount(4);
    m_gameTable->setHorizontalHeaderLabels({
        QStringLiteral("TITLE"),
        QStringLiteral("SYSTEM / FORMAT"),
        QStringLiteral("CORE STATUS"),
        QStringLiteral("FILE LOCATION")
    });
    m_gameTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    m_gameTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    m_gameTable->setSelectionMode(QAbstractItemView::ExtendedSelection);
    m_gameTable->setAlternatingRowColors(true);
    m_gameTable->setShowGrid(false);
    m_gameTable->verticalHeader()->setVisible(false);
    m_gameTable->verticalHeader()->setDefaultSectionSize(42);
    m_gameTable->horizontalHeader()->setHighlightSections(false);
    m_gameTable->horizontalHeader()->setSectionResizeMode(0, QHeaderView::ResizeToContents);
    m_gameTable->horizontalHeader()->setSectionResizeMode(1, QHeaderView::ResizeToContents);
    m_gameTable->horizontalHeader()->setSectionResizeMode(2, QHeaderView::ResizeToContents);
    m_gameTable->horizontalHeader()->setSectionResizeMode(3, QHeaderView::Stretch);
    m_gameTable->setWordWrap(false);
    m_gameTable->setSortingEnabled(false);
    mainLayout->addWidget(m_gameTable, 1);

    m_statusLabel = new QLabel(
        QStringLiteral("Ready. No emulation cores are bundled in this initial scaffold."),
        mainPanel);
    m_statusLabel->setObjectName(QStringLiteral("Muted"));
    m_statusLabel->setWordWrap(true);
    mainLayout->addWidget(m_statusLabel);

    root->addWidget(sidebar);
    root->addWidget(mainPanel, 1);
    setCentralWidget(central);

    connect(addFilesButton, &QPushButton::clicked, this, &MainWindow::addGameFiles);
    connect(scanButton, &QPushButton::clicked, this, &MainWindow::addFolder);
    connect(removeButton, &QPushButton::clicked, this, &MainWindow::removeSelectedGame);
    connect(m_searchBox, &QLineEdit::textChanged, this, &MainWindow::filterLibrary);
    connect(m_gameTable, &QTableWidget::cellDoubleClicked, this,
            [this](int, int) { launchSelectedGame(); });

    connect(coresButton, &QPushButton::clicked, this, [this] {
        QString body;
        if (m_cores.isEmpty()) {
            body = QStringLiteral("No compatible core plugins were found.\n\n"
                                  "Core plugins will be discovered from the application's "
                                  "cores folder once they are implemented and installed.");
        } else {
            for (const auto &core : m_cores) {
                body += QStringLiteral("• %1 — %2 %3\n")
                            .arg(core.metadata.displayName,
                                 core.metadata.systemName,
                                 core.metadata.version);
            }
        }
        body += QStringLiteral("\nThe video/audio session and input runtime are not connected yet.");
        QMessageBox::information(this, QStringLiteral("System cores"), body);
    });

    connect(aboutButton, &QPushButton::clicked, this, [this] {
        QMessageBox::about(
            this,
            QStringLiteral("About nvd-emu"),
            QStringLiteral("<h2>nvd-emu 0.1.0</h2>"
                           "<p>A modular multi-system emulator project for Windows and "
                           "macOS Apple Silicon.</p>"
                           "<p>This early milestone contains the desktop frontend and a "
                           "versioned core-plugin interface. It does not yet emulate games.</p>"));
    });
}

void MainWindow::applyTheme()
{
    setStyleSheet(QStringLiteral(R"(
        QMainWindow, QWidget {
            background: #101114;
            color: #f3f3f5;
            font-family: "Inter", "Segoe UI", "Arial";
            font-size: 10pt;
        }
        QFrame#Sidebar {
            background: #15161a;
            border: 1px solid #292a30;
            border-radius: 15px;
        }
        QLabel#BrandName {
            font-size: 17pt;
            font-weight: 700;
            color: #ffffff;
        }
        QLabel#Eyebrow {
            color: #8d8f9a;
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 1px;
        }
        QLabel#PageHeading {
            font-size: 25pt;
            font-weight: 700;
            color: #ffffff;
        }
        QLabel#Muted {
            color: #9b9da7;
        }
        QLabel#SidebarNote {
            color: #999ba6;
            background: #1b1c21;
            border: 1px solid #2a2b31;
            border-radius: 10px;
            padding: 12px;
            line-height: 1.4;
        }
        QPushButton {
            padding: 9px 14px;
            border-radius: 8px;
            border: 1px solid #303139;
            background: #1d1e23;
            color: #ededf0;
        }
        QPushButton:hover {
            background: #27282f;
            border-color: #474851;
        }
        QPushButton#NavButton, QPushButton#NavActive {
            text-align: left;
            padding-left: 12px;
            border: 1px solid transparent;
            background: transparent;
        }
        QPushButton#NavButton { color: #b4b5bd; }
        QPushButton#NavButton:hover { background: #202126; }
        QPushButton#NavActive {
            background: #342023;
            border-color: #5c2c31;
            color: #ff8587;
            font-weight: 700;
        }
        QPushButton#PrimaryButton {
            background: #dc292b;
            border: 1px solid #e34345;
            color: white;
            font-weight: 700;
        }
        QPushButton#PrimaryButton:hover { background: #ed383a; }
        QLineEdit#SearchBox {
            background: #17181c;
            border: 1px solid #303139;
            border-radius: 9px;
            padding: 8px 12px;
            selection-background-color: #7c272d;
        }
        QLineEdit#SearchBox:focus { border-color: #a53b40; }
        QFrame#MetricCard {
            background: #17181c;
            border: 1px solid #2b2c33;
            border-radius: 11px;
        }
        QLabel#MetricValue {
            color: #ffffff;
            font-size: 22pt;
            font-weight: 700;
        }
        QTableWidget#GameTable {
            background: #15161a;
            alternate-background-color: #191a1f;
            border: 1px solid #2b2c33;
            border-radius: 10px;
            gridline-color: transparent;
            selection-background-color: #49272b;
            selection-color: #ffffff;
            outline: 0;
        }
        QTableWidget#GameTable::item {
            padding: 6px;
            border-bottom: 1px solid #24252b;
        }
        QHeaderView::section {
            background: #191a1f;
            color: #9b9da7;
            border: none;
            border-bottom: 1px solid #303139;
            padding: 11px 8px;
            font-size: 8pt;
            font-weight: 700;
        }
        QScrollBar:vertical {
            background: #15161a;
            width: 10px;
            margin: 2px;
        }
        QScrollBar::handle:vertical {
            background: #42434b;
            min-height: 24px;
            border-radius: 4px;
        }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }
    )"));
}

void MainWindow::loadSettings()
{
    m_scanFolders = m_settings.value(QStringLiteral("scanFolders")).toStringList();
    const QStringList savedPaths = m_settings.value(QStringLiteral("libraryPaths")).toStringList();
    for (const QString &path : savedPaths) {
        if (QFileInfo::exists(path) && isLikelyGameFile(path))
            addPathToLibrary(path);
    }
}

void MainWindow::saveSettings()
{
    QStringList paths;
    paths.reserve(m_entries.size());
    for (const auto &entry : m_entries)
        paths.push_back(entry.path);

    m_settings.setValue(QStringLiteral("libraryPaths"), paths);
    m_settings.setValue(QStringLiteral("scanFolders"), m_scanFolders);
    m_settings.sync();
}

void MainWindow::scanSavedFolders()
{
    const QStringList folders = m_scanFolders;
    for (const QString &folder : folders) {
        if (QFileInfo(folder).isDir())
            scanFolder(folder);
    }
}

void MainWindow::scanFolder(const QString &folderPath)
{
    if (folderPath.isEmpty() || !QFileInfo(folderPath).isDir())
        return;

    QDirIterator iterator(folderPath,
                          QDir::Files | QDir::Readable | QDir::NoDotAndDotDot,
                          QDirIterator::Subdirectories);
    int added = 0;
    while (iterator.hasNext()) {
        const QString path = iterator.next();
        if (!isLikelyGameFile(path))
            continue;
        const int previousSize = m_entries.size();
        addPathToLibrary(path);
        if (m_entries.size() > previousSize)
            ++added;
    }

    saveSettings();
    refreshLibrary();
    m_statusLabel->setText(
        QStringLiteral("Scan complete — %1 new game file(s) added from %2.")
            .arg(added)
            .arg(QDir::toNativeSeparators(folderPath)));
}

void MainWindow::addGameFiles()
{
    const QString filter = QStringLiteral(
        "Known game images and ROMs (*.nes *.fds *.gb *.gbc *.gba *.nds *.3ds *.cia "
        "*.sms *.gg *.md *.gen *.sfc *.smc *.n64 *.z64 *.v64 *.iso *.cso *.chd "
        "*.cue *.gcm *.rvz *.wbfs *.wud *.wux *.pbp *.zip);;All files (*)");
    const QStringList files = QFileDialog::getOpenFileNames(
        this, QStringLiteral("Add game files"), QString(), filter);

    int added = 0;
    for (const QString &path : files) {
        if (!isLikelyGameFile(path))
            continue;
        const int previousSize = m_entries.size();
        addPathToLibrary(path);
        if (m_entries.size() > previousSize)
            ++added;
    }

    saveSettings();
    refreshLibrary();
    if (!files.isEmpty()) {
        m_statusLabel->setText(
            QStringLiteral("Added %1 new game file(s). Your original files were not changed.")
                .arg(added));
    }
}

void MainWindow::addFolder()
{
    const QString folder = QFileDialog::getExistingDirectory(
        this, QStringLiteral("Select a games folder"), QDir::homePath());
    if (folder.isEmpty())
        return;

    if (!m_scanFolders.contains(folder))
        m_scanFolders.push_back(folder);
    scanFolder(folder);
}

void MainWindow::removeSelectedGame()
{
    const QModelIndexList selected = m_gameTable->selectionModel()->selectedRows();
    if (selected.isEmpty()) {
        QMessageBox::information(this, QStringLiteral("Remove games"),
                                 QStringLiteral("Select one or more games to remove from your library."));
        return;
    }

    QStringList pathsToRemove;
    for (const QModelIndex &index : selected) {
        const auto *item = m_gameTable->item(index.row(), 0);
        if (item)
            pathsToRemove.push_back(item->data(Qt::UserRole).toString());
    }

    for (const QString &path : pathsToRemove) {
        m_entries.erase(
            std::remove_if(m_entries.begin(), m_entries.end(),
                           [&path](const LibraryEntry &entry) { return entry.path == path; }),
            m_entries.end());
    }

    saveSettings();
    refreshLibrary();
    m_statusLabel->setText(QStringLiteral("Removed %1 item(s) from the library. Files on disk were not deleted.")
                               .arg(pathsToRemove.size()));
}

void MainWindow::launchSelectedGame()
{
    const int row = m_gameTable->currentRow();
    if (row < 0 || !m_gameTable->item(row, 0)) {
        QMessageBox::information(this, QStringLiteral("Launch game"),
                                 QStringLiteral("Select a game first."));
        return;
    }

    const QString path = m_gameTable->item(row, 0)->data(Qt::UserRole).toString();
    const QString extension = QFileInfo(path).suffix().toLower();
    for (const auto &core : m_cores) {
        bool matches = false;
        for (const QString &candidate : core.metadata.extensions) {
            if (candidate.compare(extension, Qt::CaseInsensitive) == 0) {
                matches = true;
                break;
            }
        }
        if (matches) {
            QMessageBox::information(
                this, QStringLiteral("Core detected"),
                QStringLiteral("%1 recognizes this file format.\n\n"
                               "The game-session runtime (video, audio, input and frame scheduling) "
                               "is still under development, so launching games is not enabled yet.")
                    .arg(core.metadata.displayName));
            return;
        }
    }

    QMessageBox::information(
        this, QStringLiteral("No compatible core"),
        QStringLiteral("nvd-emu has not found an installed core for this file format.\n\n"
                       "This build provides the library and the core-plugin interface; actual "
                       "emulation engines and the game-session runtime still need to be integrated."));
}

void MainWindow::reloadCores()
{
    m_cores.clear();

    QStringList coreDirectories = {
        QDir(QCoreApplication::applicationDirPath()).filePath(QStringLiteral("cores")),
        QDir(QStandardPaths::writableLocation(QStandardPaths::AppDataLocation))
            .filePath(QStringLiteral("cores"))
    };
    coreDirectories.removeDuplicates();

    QStringList visitedFiles;
    for (const QString &directory : coreDirectories) {
        QDir dir(directory);
        if (!dir.exists())
            continue;

        const QFileInfoList pluginFiles = dir.entryInfoList(QDir::Files | QDir::Readable);
        for (const QFileInfo &fileInfo : pluginFiles) {
            const QString path = fileInfo.absoluteFilePath();
            if (visitedFiles.contains(path))
                continue;
            visitedFiles.push_back(path);

            auto loader = QSharedPointer<QPluginLoader>::create(path);
            QObject *pluginObject = loader->instance();
            if (!pluginObject)
                continue;

            auto *core = qobject_cast<nvd::IEmulationCore *>(pluginObject);
            if (!core)
                continue;

            const nvd::CoreMetadata metadata = core->metadata();
            if (metadata.id.trimmed().isEmpty() || metadata.extensions.isEmpty())
                continue;

            m_cores.push_back({metadata, core, loader});
        }
    }

    if (m_coreCount)
        m_coreCount->setText(QString::number(m_cores.size()));
}

void MainWindow::refreshLibrary()
{
    if (!m_gameTable)
        return;

    m_gameTable->setRowCount(0);
    for (const auto &entry : m_entries) {
        const int row = m_gameTable->rowCount();
        m_gameTable->insertRow(row);

        auto *titleItem = new QTableWidgetItem(entry.title);
        titleItem->setData(Qt::UserRole, entry.path);
        titleItem->setToolTip(QDir::toNativeSeparators(entry.path));
        m_gameTable->setItem(row, 0, titleItem);

        auto *systemItem = new QTableWidgetItem(entry.system);
        systemItem->setToolTip(QStringLiteral("System is inferred from the file extension; this does not indicate emulation support."));
        m_gameTable->setItem(row, 1, systemItem);

        auto *statusItem = new QTableWidgetItem(statusForPath(entry.path));
        m_gameTable->setItem(row, 2, statusItem);

        auto *pathItem = new QTableWidgetItem(QDir::toNativeSeparators(entry.path));
        pathItem->setToolTip(QDir::toNativeSeparators(entry.path));
        m_gameTable->setItem(row, 3, pathItem);
    }

    if (m_libraryCount)
        m_libraryCount->setText(QString::number(m_entries.size()));
    if (m_coreCount)
        m_coreCount->setText(QString::number(m_cores.size()));

    filterLibrary(m_searchBox ? m_searchBox->text() : QString());
}

void MainWindow::filterLibrary(const QString &query)
{
    const QString needle = query.trimmed();
    for (int row = 0; row < m_gameTable->rowCount(); ++row) {
        bool matches = needle.isEmpty();
        if (!matches) {
            for (int column = 0; column < m_gameTable->columnCount(); ++column) {
                const auto *item = m_gameTable->item(row, column);
                if (item && item->text().contains(needle, Qt::CaseInsensitive)) {
                    matches = true;
                    break;
                }
            }
        }
        m_gameTable->setRowHidden(row, !matches);
    }
}

QString MainWindow::guessSystem(const QString &path) const
{
    const QString extension = QFileInfo(path).suffix().toLower();

    if ({"nes", "fds", "unf", "unif"}.contains(extension))
        return QStringLiteral("NES / Famicom");
    if (extension == "gb")
        return QStringLiteral("Game Boy");
    if (extension == "gbc")
        return QStringLiteral("Game Boy Color");
    if (extension == "gba")
        return QStringLiteral("Game Boy Advance");
    if (extension == "nds")
        return QStringLiteral("Nintendo DS");
    if ({"3ds", "cia"}.contains(extension))
        return QStringLiteral("Nintendo 3DS");
    if ({"sms", "gg"}.contains(extension))
        return QStringLiteral("Master System / Game Gear");
    if ({"md", "gen", "32x"}.contains(extension))
        return QStringLiteral("Mega Drive / Genesis family");
    if ({"sfc", "smc"}.contains(extension))
        return QStringLiteral("Super Nintendo");
    if ({"n64", "z64", "v64"}.contains(extension))
        return QStringLiteral("Nintendo 64");
    if ({"gcm", "rvz", "wbfs", "wud", "wux"}.contains(extension))
        return QStringLiteral("Console disc image");
    if ({"iso", "cso", "chd", "cue", "pbp"}.contains(extension))
        return QStringLiteral("Disc image / container");
    if (extension == "zip")
        return QStringLiteral("Archive (contents unverified)");

    return QStringLiteral("Unknown format");
}

QString MainWindow::statusForPath(const QString &path) const
{
    const QString extension = QFileInfo(path).suffix().toLower();
    for (const auto &core : m_cores) {
        for (const QString &candidate : core.metadata.extensions) {
            if (candidate.compare(extension, Qt::CaseInsensitive) == 0)
                return QStringLiteral("Core found · runtime pending");
        }
    }
    return QStringLiteral("No compatible core");
}

bool MainWindow::isLikelyGameFile(const QString &path) const
{
    return kGameExtensions.contains(QFileInfo(path).suffix().toLower());
}

void MainWindow::addPathToLibrary(const QString &path)
{
    const QFileInfo info(path);
    if (!info.exists() || !info.isFile() || !isLikelyGameFile(path))
        return;

    const QString absolutePath = info.absoluteFilePath();
    for (const auto &entry : m_entries) {
        if (entry.path == absolutePath)
            return;
    }

    m_entries.push_back({
        absolutePath,
        displayFileName(absolutePath),
        guessSystem(absolutePath),
        statusForPath(absolutePath)
    });
}
