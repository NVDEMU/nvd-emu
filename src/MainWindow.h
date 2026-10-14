#pragma once

#include "nvd/CoreInterface.h"

#include <QMainWindow>
#include <QSettings>
#include <QStringList>
#include <QVector>
#include <QSharedPointer>

class QLabel;
class QLineEdit;
class QTableWidget;
class QPluginLoader;

class MainWindow final : public QMainWindow {
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override = default;

private:
    struct LibraryEntry {
        QString path;
        QString title;
        QString system;
        QString status;
    };

    struct LoadedCore {
        nvd::CoreMetadata metadata;
        nvd::IEmulationCore *instance = nullptr;
        QSharedPointer<QPluginLoader> loader;
    };

    void buildUi();
    void applyTheme();
    void loadSettings();
    void saveSettings();
    void scanSavedFolders();
    void scanFolder(const QString &folderPath);
    void addGameFiles();
    void addFolder();
    void removeSelectedGame();
    void launchSelectedGame();
    void reloadCores();
    void refreshLibrary();
    void filterLibrary(const QString &query);
    QString guessSystem(const QString &path) const;
    QString statusForPath(const QString &path) const;
    bool isLikelyGameFile(const QString &path) const;
    void addPathToLibrary(const QString &path);

    QSettings m_settings;
    QStringList m_scanFolders;
    QVector<LibraryEntry> m_entries;
    QVector<LoadedCore> m_cores;

    QLabel *m_libraryCount = nullptr;
    QLabel *m_coreCount = nullptr;
    QLabel *m_statusLabel = nullptr;
    QLineEdit *m_searchBox = nullptr;
    QTableWidget *m_gameTable = nullptr;
};
