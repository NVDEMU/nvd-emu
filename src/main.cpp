#include "MainWindow.h"

#include <QApplication>
#include <QFont>
#include <QIcon>

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    QCoreApplication::setOrganizationName(QStringLiteral("NVDEMU"));
    QCoreApplication::setApplicationName(QStringLiteral("nvd-emu"));
    QCoreApplication::setApplicationVersion(QStringLiteral("0.1.0"));

    app.setWindowIcon(QIcon(QStringLiteral(":/brand/nvd-emu-logo.svg")));
    app.setFont(QFont(QStringLiteral("Arial"), 10));

    MainWindow window;
    window.show();
    return app.exec();
}
