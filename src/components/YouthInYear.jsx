import { BadgeDelta, Card, Metric, Text } from "@tremor/react";
import { Spinner } from "./Spinner";
import { useEffect, useState } from "react";

import { supabase } from "../supabaseClient";

export function YouthInYear() {
  const [data, setData] = useState([]);
  const [delta, setDelta] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.rpc(
        "get_result_count_by_age_range",
        {
          min_age: 13,
          max_age: 16,
        }
      );

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        const sortedData = data.sort((a, b) => b.event_year - a.event_year);
        setData(sortedData);
        setDelta(
          ((sortedData[0].result_count - sortedData[1].result_count) /
            sortedData[0].result_count) *
            100
        );
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="col-span-1" decoration="top" decorationColor="indigo">
      <div className="flex justify-between items-center mb-2">
        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          Antall ungdomsstarter i {new Date().getFullYear()}
        </p>
      </div>
      {data.length ? (
        <div className="flex gap-2 items-end">
          <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
            {data[0].result_count}
          </p>
          {delta ? (
            <BadgeDelta
              deltaType={delta > 0 ? "moderateIncrease" : "moderateDecrease"}
              isIncreasePositive={true}
            >
              {delta.toFixed(2)}%
            </BadgeDelta>
          ) : null}
        </div>
      ) : (
        <Spinner />
      )}
    </Card>
  );
}
