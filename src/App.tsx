import React, { MouseEvent, useEffect, useState } from "react";
import logo from "./logo.svg";
import axios from "axios";
import "./App.css";
import { OrderResponse } from "./types/index";
import { DataGrid, GridColDef, GridCellParams } from "@mui/x-data-grid";
import Box from "../node_modules/@mui/material/Box/Box";
import {
  GridValueGetterParams,
  GridValueSetterParams,
} from "../node_modules/@mui/x-data-grid/models/params/gridCellParams.d";
import { Button } from "@mui/material";
import { MuiSnackBar } from "./components/MuiSnackBar";
import { Open } from "./types/muiSnakBar";
import { DataGridPro } from "../node_modules/@mui/x-data-grid-pro/DataGridPro/DataGridPro";

function App() {
  const [open, setOpen] = useState<Open>({
    result: "",
    open: false,
    reason: "",
  });
  const columns: GridColDef[] = [
    {
      field: "orderName",
      headerName: "수령자 및 상품 정보",
      width: 1000,
      editable: false,
      renderCell: (params) => (
        <>
          <div className="first_tap">
            <div>구매자 이름 : {params.row.orderName}</div>
            <div>구매자 phone : {params.row.orderMemberTel}</div>
            <div>수령자 이름 : {params.row.receiverName}</div>
            <div>수령자 phone : {params.row.receiverPhone}</div>
            <div>개인통관번호 : {params.row.pcc}</div>
            <div>{params.row.productName}</div>
            <div>
              {params.row.productOptionContents}
              <span> / 수량: {params.row.orderQuantity}</span>
            </div>
            <div>
              <a href={params.row.taobaoUrl} target="_blank" rel="noreferrer">
                {" "}
                타오바오 주문 URL
              </a>
            </div>
          </div>
        </>
      ),
    },

    {
      field: "productOrderStatus",
      headerName: "상품상태",
      type: "string",
      width: 200,
      editable: false,
      valueGetter: (params: GridValueGetterParams) =>
        `${params.row.productOrderStatus || "배송중"} `,
    },
    {
      field: "invoiceNo",
      headerName: "송장번호",
      type: "string",
      width: 200,
      editable: true,
      valueGetter: (params: GridValueGetterParams) =>
        `${params.row.invoiceNo || "invoiceNumber 입력필요"} `,
      valueSetter: (params: GridValueSetterParams) => {
        const invoiceNo = params.value;
        params.row["invoiceNo"] = invoiceNo;
        return { ...params.row };
      },
    },
    {
      field: "payAmt",
      headerName: "구매가격",
      type: "string",
      width: 200,
      editable: true,
      valueGetter: (params: GridValueGetterParams) => {
        const payAmt = Number((params.row.payAmt * 1400).toFixed(0));
        return `${params.row.payAmt || 0}USD (${payAmt || 0}) `;
      },
      valueSetter: (params: GridValueSetterParams) => {
        const payAmt = params.value;

        params.row["payAmt"] = payAmt;
        return { ...params.row };
      },
    },
    {
      field: "deliveryAmt",
      headerName: "배대지 가격",
      type: "string",
      width: 200,
      editable: true,
      valueGetter: (params: GridValueGetterParams) =>
        `${params.row.deliveryAmt || 0} `,
      valueSetter: (params: GridValueSetterParams) => {
        const deliveryAmt = params.value;
        params.row["deliveryAmt"] = deliveryAmt;
        return { ...params.row };
      },
    },
    {
      field: "settlementExpectAmount",
      headerName: "마진",
      type: "string",
      width: 200,
      editable: false,
      valueGetter: (params: GridValueGetterParams) => {
        const settlementExpectAmount: number =
          params.row.settlementExpectAmount;
        const payAmt = Number((params.row.payAmt * 1400).toFixed(0));
        const deliveryAmt = params.row.deliveryAmt;
        return `${settlementExpectAmount - payAmt - deliveryAmt}원`;
      },

      // valueSetter: (params: GridValueSetterParams) => {
      //   const deliveryAmt = params.value;
      //   params.row["deliveryAmt"] = deliveryAmt;
      //   return { ...params.row };
      // },
    },

    {
      field: "발주확인 & 발송처리",
      headerName: "발주확인 & 발송처리",
      description: "This column has a value getter and is not sortable.",
      sortable: false,
      width: 300,

      renderCell: (params) => (
        <>
          <strong>
            <Button
              disabled={params.row.orderStatus === "DELIVERING" ? true : false}
              size="large"
              color={
                params.row.productOrderStatus === "NEW_ORDER"
                  ? "primary"
                  : "warning"
              }
              variant="contained"
              style={{ marginLeft: 16 }}
              onClick={() => {
                params.row.productOrderStatus === "NEW_ORDER"
                  ? confirmOrder(params.row)
                  : updateInvoiceNo(params.row);
              }}
            >
              {params.row.orderStatus === "DELIVERING"
                ? "배송중"
                : params.row.productOrderStatus === "NEW_ORDER"
                ? "발주확인"
                : "발송처리"}
            </Button>
          </strong>
        </>
      ),
    },
    {
      field: "배대지 신청",
      headerName: "배대지 신청",
      description: "배대지 신청을 해야합니다.",
      sortable: false,
      width: 300,

      renderCell: (params) => (
        <>
          <strong>
            <Button
              disabled={params.row.orderStatus === "DELIVERING" ? true : false}
              size="large"
              color="primary"
              variant="contained"
              style={{ marginLeft: 16 }}
              onClick={() => {
                ship(params.row);
              }}
            >
              배대지 신청
            </Button>
          </strong>
        </>
      ),
    },
  ];

  const [order, setOrder] = useState<OrderResponse[]>([]);
  function getOrderInfo() {
    axios
      .get(`${process.env.REACT_APP_API_URL}/smart-store/order`)
      .then((response) => {
        setOrder(response.data);
      });
  }

  async function getNewOrder() {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/smart-store/newOrder`
      );
      setOpen({ result: "success", open: true, reason: "신규주문" });
    } catch (e) {
      setOpen({ result: "error", open: true, reason: "신규주문" });
    }
  }

  async function updateOrderInfo(orderInfo: OrderResponse) {
    console.log(orderInfo);

    try {
      const data = await axios.put(
        `${process.env.REACT_APP_API_URL}/smart-store/update/orderInfo`,
        orderInfo
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }

  async function updateInvoiceNo(orderInfo: OrderResponse) {
    try {
      const data = await axios.get(
        `${process.env.REACT_APP_API_URL}/smart-store/productDispatch/${orderInfo.orderNo}/${orderInfo.invoiceNo}`
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }

  async function ship(orderInfo: OrderResponse) {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/smart-store/ship/${orderInfo.id}`
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }
  function handleClick(cellParams: any) {
    if (
      cellParams.field === "invoiceNo" ||
      cellParams.field === "deliveryAmt" ||
      cellParams.field === "orderAmt"
    )
      return;
    navigator.clipboard.writeText(cellParams.value);
  }
  async function confirmOrder(orderInfo: OrderResponse) {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/smart-store/product-order-confirm`,
        {
          productOrderIds: [orderInfo.productOrderNo],
        }
      );
      setOpen({ result: "success", open: true, reason: "발송처리" });
    } catch (e) {
      setOpen({ result: "error", open: true, reason: "발송처리" });
    }
  }
  useEffect(() => {
    getOrderInfo();
  }, [open]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>슴무트수토우 주문 및 배송현황</h1>
      </header>
      <div className="App-center">
        <Button
          color="primary"
          size="large"
          variant="contained"
          style={{ marginLeft: 16 }}
          onClick={getNewOrder}
        >
          주문수집
        </Button>
        <Box sx={{ height: "  80%", width: "100%" }}>
          <DataGridPro
            sx={{ fontSize: "2rem" }}
            onCellEditStop={(data) => {
              updateOrderInfo(data.row);
            }}
            rowHeight={300}
            onCellClick={(params) => {
              handleClick(params);
            }}
            rows={order}
            columns={columns}
            initialState={{
              pinnedColumns: {
                left: ["orderName", "receiverPhone", "pcc", "productName"],
              },
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[5]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
        <MuiSnackBar open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}

export default App;
