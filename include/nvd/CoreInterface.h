#pragma once

#include <QString>
#include <QStringList>
#include <QtPlugin>

namespace nvd {

struct CoreMetadata {
    QString id;
    QString displayName;
    QString systemName;
    QString version;
    // File extensions without dots, e.g. "nes" or "gbc".
    QStringList extensions;
};

// Stable starting point for separately built Qt core plugins.
// This is an integration seam, not a claim that any system is playable yet.
class IEmulationCore {
public:
    virtual ~IEmulationCore() = default;

    virtual CoreMetadata metadata() const = 0;
    virtual bool loadGame(const QString &path, QString *errorMessage) = 0;
    virtual void unloadGame() = 0;
    virtual bool isGameLoaded() const = 0;
    virtual bool runFrame(QString *errorMessage) = 0;
};

} // namespace nvd

#define NVD_EMULATION_CORE_IID "com.nvdemu.nvd-emu.IEmulationCore/1.0"
Q_DECLARE_INTERFACE(nvd::IEmulationCore, NVD_EMULATION_CORE_IID)
