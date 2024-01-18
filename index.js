
/*This web application enables user interaction with a portal for managing customer data.
Users log in to access functionalities like creating, viewing, updating, and deleting customer information.
A navigation bar helps in easy access to these operations.*/

const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let accessToken = "";

const navbar = `
  <nav style="display: flex; justify-content: space-around; padding: 10px;">
    <a href="/create-customer" style="text-decoration: none; padding: 5px;">Create Customer</a>
    <a href="/view-customers" style="text-decoration: none; padding: 5px;">View Customers</a>
    <a href="/delete-customer" style="text-decoration: none; padding: 5px;">Delete Customer</a>
    <a href="/update-customer" style="text-decoration: none; padding: 5px;">Update Customer</a>
  </nav>
`;

app.get("/", (req, res) => {
  res.send(`
    <form action="/authenticate" method="post" style="text-align: center; margin-top: 50px;">
      <label for="login">Login:</label>
      <input type="text" id="login" name="login" required><br>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required><br>
      <button type="submit">Submit</button>
    </form>
  `);
});

app.post("/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const response = await axios.post(
      "https://qa.sunbasedata.com/sunbase/portal/api/assignment_auth.jsp",
      {
        login_id: login,
        password: password,
      }
    );
    accessToken = response.data.access_token;

    res.redirect("/authenticated");
  } catch (error) {
    console.error(error);
    res.status(500).send("<div style='text-align: center;'><h2>Internal Server Error</h2></div>");
  }
});

app.get("/authenticated", (req, res) => {
  res.send(`
    <div style="text-align: center; margin-top: 50px;">
      <h3>User Authenticated</h3>
      ${navbar}
    </div>
  `);
});

app.get("/home", (req, res) => {
  res.send(navbar);
});

app.get("/create-customer", (req, res) => {
  res.send(`
    <form action="/customers" method="post" style="text-align: center; margin-top: 50px;">
      <label for="firstName">First Name:</label>
      <input type="text" id="firstName" name="first_name" required><br>
      <label for="lastName">Last Name:</label>
      <input type="text" id="lastName" name="last_name" required><br>
      <label for="street">Street:</label>
      <input type="text" id="street" name="street"><br>
      <label for="address">Address:</label>
      <input type="text" id="address" name="address"><br>
      <label for="city">City:</label>
      <input type="text" id="city" name="city"><br>
      <label for="state">State:</label>
      <input type="text" id="state" name="state"><br>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email"><br>
      <label for="phone">Phone:</label>
      <input type="text" id="phone" name="phone"><br>
      <button type="submit">Create Customer</button>
    </form>
  `);
});

app.post("/customers", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      street,
      address,
      city,
      state,
      email,
      phone,
    } = req.body;

    const customerResponse = await axios.post(
      "https://qa.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      {
        first_name: first_name,
        last_name: last_name,
        street: street,
        address: address,
        city: city,
        state: state,
        email: email,
        phone: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "create",
        },
      }
    );

    if (customerResponse.status === 201) {
      res.status(201).send(`
        Successfully Created
        ${navbar}
      `);
    } else {
      res.status(400).send(`
        First Name or Last Name is missing
        ${navbar}
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      Internal Server Error
      ${navbar}
    `);
  }
});

app.get("/view-customers", async (req, res) => {
  try {
    const customerListResponse = await axios.get(
      "https://qa.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "get_customer_list",
        },
      }
    );

    const customerList = customerListResponse.data;

    if (customerList.length === 0) {
      res.send("<h2>No customers found</h2>");
      return;
    }

    const keys = Object.keys(customerList[0]);

    let tableHtml = "<div style='text-align: center; margin-top: 50px;'>";
    tableHtml += "<h2>Customer List</h2><table border='1'><tr>";

    keys.forEach((key) => {
      tableHtml += `<th>${key}</th>`;
    });
    tableHtml += "</tr>";

    customerList.forEach((customer) => {
      tableHtml += "<tr>";
      keys.forEach((key) => {
        tableHtml += `<td>${customer[key]}</td>`;
      });
      tableHtml += "</tr>";
    });

    tableHtml += "</table>";
    tableHtml += `${navbar}</div>`;
    res.send(tableHtml);
  } catch (error) {
    console.error(error);
    res.status(500).send("<div style='text-align: center;'><h2>Internal Server Error</h2></div>");
  }
});

app.get("/delete-customer", (req, res) => {
  res.send(`
    <form action="/deleted-customer" method="post" style="text-align: center; margin-top: 50px;">
      <label for="uuid">Customer UUID:</label>
      <input type="text" id="uuid" name="uuid" required><br>
      <button type="submit">Delete Customer</button>
    </form>
  `);
});

app.post("/deleted-customer", async (req, res) => {
  try {
    const { uuid } = req.body;
    const deleteResponse = await axios.post(
      "https://qa.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "delete",
          uuid: uuid,
        },
      }
    );

    if (deleteResponse.status === 200) {
      res.status(200).send(`
        ${navbar}
        Successfully Deleted
      `);
    } else if (deleteResponse.status === 400) {
      res.status(400).send(`
        ${navbar}
        UUID not found
      `);
    } else {
      res.status(500).send(`
        ${navbar}
        Error. Not Deleted
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      ${navbar}
      Internal Server Error
    `);
  }
});


app.get("/update-customer", (req, res) => {
  res.send(`
    <form action="/update-customer" method="post" style="text-align: center; margin-top: 50px;">
      <label for="uuid">Customer UUID:</label>
      <input type="text" id="uuid" name="uuid" required><br>
      <label for="firstName">First Name:</label>
      <input type="text" id="firstName" name="first_name" required><br>
      <label for="lastName">Last Name:</label>
      <input type="text" id="lastName" name="last_name" required><br>
      <label for="street">Street:</label>
      <input type="text" id="street" name="street"><br>
      <label for="address">Address:</label>
      <input type="text" id="address" name="address"><br>
      <label for="city">City:</label>
      <input type="text" id="city" name="city"><br>
      <label for="state">State:</label>
      <input type="text" id="state" name="state"><br>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email"><br>
      <label for="phone">Phone:</label>
      <input type="text" id="phone" name="phone"><br>
      <button type="submit">Update Customer</button>
    </form>
  `);
});

app.post("/update-customer", async (req, res) => {
  try {
    const {
      uuid,
      first_name,
      last_name,
      street,
      address,
      city,
      state,
      email,
      phone,
    } = req.body;

    const updateResponse = await axios.post(
      "https://qa.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      {
        first_name: first_name,
        last_name: last_name,
        street: street,
        address: address,
        city: city,
        state: state,
        email: email,
        phone: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "update",
          uuid: uuid,
        },
      }
    );

    if (updateResponse.status === 200) {
      res.status(200).send(`
        Successfully Updated
        ${navbar}
      `);
    } else if (updateResponse.status === 400) {
      res.status(400).send(`
        Body is Empty
        ${navbar}
      `);
    } else if (updateResponse.status === 500) {
      res.status(500).send(`
        UUID not found
        ${navbar}
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      Internal Server Error
      ${navbar}
    `);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
