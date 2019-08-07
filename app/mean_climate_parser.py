import json
import csv
import glob
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.WARNING,
                    format="%(asctime)s:%(levelname)s:%(filename)s:%(funcName)s:%(lineno)d:%(message)s")


def all_seasons_for_variable(variable, region, statistic):
    output = {}
    run = 'r1i1p1'

    json_files_path = os.path.join(
        os.path.dirname(__file__), 'static', 'mean_climate_json_files')
    variable_filename = os.path.join(
        json_files_path, "{}_2.5x2.5_regrid2_regrid2_metrics.json".format(variable))

    json_file_object = open(variable_filename)
    json_object = json.load(json_file_object)
    json_file_object.close()
    models_list = list(json_object["RESULTS"].keys())
    season_list = list(json_object['RESULTS'][models_list[0]]
                       ['defaultReference'][run][region][statistic].keys())

    for model in sorted(models_list, key=lambda s: s.lower()):
        print("model:", model)

        output[model] = {}
        statistics = json_object['RESULTS'][model]['defaultReference'][run][region].keys(
        )
        print('statistics:', statistics)
        seasons = json_object["RESULTS"][model]["defaultReference"][run][region][statistic]
        output[model] = seasons
        print("seasons:", seasons)

    headerline = ['model_name'] + season_list

    csv_file_name = "all_season_{}-{}-{}.csv".format(
        variable, region, statistic)

    print("csv_file_name:", csv_file_name)
    csv_file_path = os.path.join(json_files_path, csv_file_name)

    with open(csv_file_path, 'w') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(headerline)
        for i, model in enumerate(models_list):
            try:
                csvwriter.writerow(
                    [model]
                    + [round(float(output[model][season]), 3) for season in season_list])
            except Exception as error:
                print("csv error:", error)
                pass


def all_variables_by_season(region, statistic, season):
    output = []
    json_files_path = os.path.join(
        os.path.dirname(__file__), 'static', 'mean_climate_json_files')

    headerline = ['model_name']
    mean_climate_files = glob.glob("{}/*.json".format(json_files_path))
    mean_climate_files.sort()
    for json_file_path in mean_climate_files:
        json_file_name = Path(json_file_path).name
        variable_name = json_file_name.split("_")[0]
        headerline.append(variable_name)

        json_file_object = open(json_file_path)
        json_object = json.load(json_file_object)
        json_file_object.close()

        models_list = list(json_object["RESULTS"].keys())
        if not output:
            output.append(models_list)

        if variable_name == "tas":
            region = "land_" + region
        else:
            region = region
        values = []
        for model in models_list:
            try:
                values.append(
                    json_object["RESULTS"][model]["defaultReference"]['r1i1p1'][region][statistic][season])
            except KeyError as error:
                logging.error("error occurred with variable {} regarding model: {}".format(
                    json_file_name, model))
                print("error:", error)
                raise
        output.append(values)

    rows = zip(*output)
    csv_file_name = "all_variable_{}-{}-{}.csv".format(
        region, statistic, season)
    csv_file_path = os.path.join(json_files_path, csv_file_name)
    print("csv_file_path:", csv_file_path)
    with open(csv_file_path, 'w') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(headerline)
        for row in rows:
            try:
                csvwriter.writerow(row)
            except Exception as error:
                print("csv error:", error)
                pass


def main():
    json_files_path = os.path.join(
        os.path.dirname(__file__), '../mean_climate_json_files')

    mean_climate_files = glob.glob("{}/*.json".format(json_files_path))

    region = "global"
    statistic = "rms_xy"

    for climate_file in mean_climate_files:
        all_seasons_for_variable(climate_file, region, statistic)


if __name__ == "__main__":
    main()
