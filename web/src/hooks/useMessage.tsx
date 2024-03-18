import { useQuery } from "@apollo/client";
import * as queries from "graphql/queries";
import { useEffect, useState } from "react";

export function useMessage(
  objectId: any // eslint-disable-line
) {
  const [message, setMessage] = useState<any>([]);

  const { data, loading } = useQuery(queries.GET_MESSAGE, {
    variables: {
      objectId: objectId,
    },
    skip: !objectId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data) {
      setMessage(data.getMessage);
    }
  }, [data]);

  return {
    value: message,
    loading,
  };
}
