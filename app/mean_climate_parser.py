import json
import csv
import glob
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.WARNING,
                    format="%(asctime)s:%(levelname)s:%(filename)s:%(funcName)s:%(lineno)d:%(message)s")


def all_seasons_for_variable(variable, model_generation, region, statistic):
    output = {}
    run = 'r1i1p1'

    json_files_path = os.path.join(
        os.path.dirname(__file__), 'static', 'mean_climate_json_files', "{}_json".format(model_generation))
    variable_filename = os.path.join(
        json_files_path, "{}.{}.historical.regrid2.2p5x2p5.v20190801.json".format(variable, model_generation.upper()))

    json_file_object = open(variable_filename)
    json_object = json.load(json_file_object)
    json_file_object.close()
    models_list = list(json_object["RESULTS"].keys())
    season_list = list(json_object['RESULTS'][models_list[0]]
                       ['default'][run][region][statistic].keys())

    for model in sorted(models_list, key=lambda s: s.lower()):
        print("model:", model)

        output[model] = {}
        statistics = json_object['RESULTS'][model]['default'][run][region].keys(
        )
        print('statistics:', statistics)
        seasons = json_object["RESULTS"][model]["default"][run][region][statistic]
        output[model] = seasons
        print("seasons:", seasons)

    headerline = ['model_name'] + season_list

    csv_file_name = "all_seasons_{}-{}-{}-{}.csv".format(
        variable, model_generation, region, statistic)

    print("csv_file_name:", csv_file_name)
    csv_directory_path = os.path.join(
        os.path.dirname(__file__), 'static', 'mean_climate_json_files', "{}_csv".format(model_generation))
    csv_file_path = os.path.join(csv_directory_path, csv_file_name)

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


def all_variables_by_season(season, model_generation, region, statistic):
    output = []
    json_files_path = os.path.join(
        os.path.dirname(__file__), 'static', 'mean_climate_json_files', "{}_json".format(model_generation))

    headerline = ['model_name']
    mean_climate_files = glob.glob("{}/*.json".format(json_files_path))
    mean_climate_files.sort()
    for json_file_path in mean_climate_files:
        json_file_name = Path(json_file_path).name
        variable_name = json_file_name.split(".")[0]
        headerline.append(variable_name)

        json_file_object = open(json_file_path)
        json_object = json.load(json_file_object)
        json_file_object.close()

        models_list = list(json_object["RESULTS"].keys())
        if not output:
            output.append(models_list)

        values = []
        for model in models_list:
            try:
                values.append(
                    json_object["RESULTS"][model]["default"]['r1i1p1'][region][statistic][season])
            except KeyError as error:
                logging.error("error occurred with variable {} regarding model: {}".format(
                    json_file_name, model))
                print("error:", error)
                raise
        output.append(values)

    rows = zip(*output)
    csv_file_name = "all_variables_{}-{}-{}-{}.csv".format(season, model_generation,
                                                           region, statistic)
    csv_directory_path = os.path.join(
        os.path.dirname(__file__), 'static', 'mean_climate_json_files', "{}_csv".format(model_generation))
    csv_file_path = os.path.join(csv_directory_path, csv_file_name)
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


def get_variables_from_json_filenames(model_generation_directory):
    data_directory = os.path.join(
        os.path.dirname(__file__), "static", "mean_climate_json_files", "{}_json".format(model_generation_directory))
    climate_json_file_paths = glob.glob("{}/*.json".format(data_directory))
    climate_json_files = [
        Path(filename).name for filename in climate_json_file_paths]
    variables = []
    for json_file in climate_json_files:
        variables.append(json_file.split(".")[0])

    variables.sort()
    return variables


def main():
    cmip5_variables = get_variables_from_json_filenames("cmip5")
    cmip6_variables = get_variables_from_json_filenames("cmip6")
    # cmip5_json_files_path = os.path.join(
    #     os.path.dirname(__file__), '../mean_climate_json_files', "cmip5_json")

    # mean_climate_files = glob.glob("{}/*.json".format(cmip5_json_files_path))

    region = "global"
    statistic = "bias_xy"
    season = "ann"

    # Model Generation, Region, Statistic and Season

    for cmip5_var, cmip6_var in zip(cmip5_variables, cmip6_variables):
        print("cmip5:", cmip5_var)
        all_seasons_for_variable(cmip5_var, "cmip5", region, statistic)
        all_variables_by_season(season, "cmip5", region, statistic)
        print("cmip6:", cmip6_var)
        all_seasons_for_variable(cmip6_var, "cmip6", region, statistic)
        all_variables_by_season(season, "cmip6", region, statistic)

    # for climate_file in mean_climate_files:
    #     # Variable, Model Generation, Region, Statistic
    #     all_seasons_for_variable(climate_file, region, statistic)


if __name__ == "__main__":
    main()
