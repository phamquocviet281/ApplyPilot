
#include <iostream>
#include <string>
#include <vector>
#include <fstream>
using namespace std;

struct JobApplication {
    string company;
    string position;
    string status;
};

void displayMenu() {
    cout << "\n====================================\n";
    cout << "             APPLYPILOT\n";
    cout << "      Job Application Tracker\n";
    cout << "====================================\n";
    cout << "1. Add Application\n";
    cout << "2. View Applications\n";
    cout << "3. View Statistics\n";
    cout << "4. Save and Exit\n";
    cout << "Choose an option: ";
}

void addApplication(vector<JobApplication>& applications) {
    JobApplication job;

    cout << "\nCompany name: ";
    getline(cin >> ws, job.company);

    cout << "Position: ";
    getline(cin, job.position);

    job.status = "Applied";

    applications.push_back(job);

    cout << "\nApplication added successfully!\n";
}

void viewApplications(const vector<JobApplication>& applications) {
    cout << "\n========== YOUR APPLICATIONS ==========\n";

    if (applications.empty()) {
        cout << "No applications yet. Add your first job!\n";
        return;
    }

    for (int i = 0; i < applications.size(); i++) {
        cout << "\nApplication #" << i + 1 << "\n";
        cout << "Company: " << applications[i].company << "\n";
        cout << "Position: " << applications[i].position << "\n";
        cout << "Status: " << applications[i].status << "\n";
    }
}

void viewStatistics(const vector<JobApplication>& applications) {
    int total = applications.size();
    int applied = 0;
    int interviews = 0;
    int offers = 0;
    int rejected = 0;

    for (int i = 0; i < applications.size(); i++) {
        if (applications[i].status == "Applied") {
            applied++;
        } else if (applications[i].status == "Interview") {
            interviews++;
        } else if (applications[i].status == "Offer") {
            offers++;
        } else if (applications[i].status == "Rejected") {
            rejected++;
        }
    }

    cout << "\n========== JOB SEARCH STATISTICS ==========\n";
    cout << "Total applications: " << total << "\n";
    cout << "Applied: " << applied << "\n";
    cout << "Interviews: " << interviews << "\n";
    cout << "Offers: " << offers << "\n";
    cout << "Rejected: " << rejected << "\n";
}

void saveApplications(const vector<JobApplication>& applications) {
    ofstream outFile("applications.txt");

    if (!outFile) {
        cout << "Error saving applications.\n";
        return;
    }

    for (int i = 0; i < applications.size(); i++) {
        outFile << applications[i].company << "\n";
        outFile << applications[i].position << "\n";
        outFile << applications[i].status << "\n";
    }

    outFile.close();
    cout << "Applications saved successfully!\n";
}

void loadApplications(vector<JobApplication>& applications) {
    ifstream inFile("applications.txt");

    if (!inFile) {
        return;
    }

    JobApplication job;

    while (getline(inFile, job.company) &&
           getline(inFile, job.position) &&
           getline(inFile, job.status)) {
        applications.push_back(job);
    }

    inFile.close();
}

int main() {
    vector<JobApplication> applications;
    int choice;

    loadApplications(applications);

    do {
        displayMenu();
        cin >> choice;

        switch (choice) {
            case 1:
                addApplication(applications);
                break;

            case 2:
                viewApplications(applications);
                break;

            case 3:
                viewStatistics(applications);
                break;

            case 4:
                saveApplications(applications);
                cout << "\nThank you for using ApplyPilot!\n";
                break;

            default:
                cout << "\nInvalid option. Please choose 1-4.\n";
        }

    } while (choice != 4);

    return 0;
}
